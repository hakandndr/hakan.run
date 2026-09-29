import React, { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from '@remix-run/router';
import { canStartViewTransition, commitInRouteTransition, shouldTransitionRoute } from './transition-scope';

// BrowserRouter with one addition: selected pathname changes are committed
// synchronously inside document.startViewTransition(), so the browser blends
// the previous rendered state into the new one instead of cutting. PUSH, POP
// and REPLACE all arrive through the same history listener. The update
// callback must stay synchronous: rendering is paused until it returns, so
// waiting on a frame or an animation there would stall the page.
const TransitionRouter = ({ children }) => {
  const historyRef = useRef(null);
  if (historyRef.current === null) historyRef.current = createBrowserHistory({ v5Compat: true });
  const history = historyRef.current;
  const [state, setState] = useState({ action: history.action, location: history.location });
  const pathnameRef = useRef(history.location.pathname);

  useLayoutEffect(() => history.listen(({ action, location }) => {
    const from = pathnameRef.current;
    pathnameRef.current = location.pathname;
    const commit = () => setState({ action, location });
    if (shouldTransitionRoute(from, location.pathname) && canStartViewTransition()) {
      document.startViewTransition(() => commitInRouteTransition(() => flushSync(commit)));
    } else {
      commit();
    }
  }), [history]);

  return (
    <Router location={state.location} navigationType={state.action} navigator={history}>
      {children}
    </Router>
  );
};

export default TransitionRouter;
