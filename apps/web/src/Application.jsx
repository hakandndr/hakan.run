import React from 'react';
import App from '@/App';
import PageTracker from '@/components/PageTracker';
import TransitionRouter from '@/router/TransitionRouter';

// The browser uses TransitionRouter; the Worker renders the same tree inside a
// StaticRouter so server markup and hydrated markup come from one component.
const Application = ({ snapshot, router: RouterComponent = TransitionRouter, routerProps = {} }) => (
  <RouterComponent {...routerProps}>
    <PageTracker />
    <App snapshot={snapshot} />
  </RouterComponent>
);

export default Application;
