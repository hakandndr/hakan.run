import React from 'react';
import App from '@/App';
import MotionPreference from '@/components/MotionPreference';
import PageTracker from '@/components/PageTracker';
import TransitionRouter from '@/router/TransitionRouter';

// The browser uses TransitionRouter; the Worker renders the same tree inside a
// StaticRouter so server markup and hydrated markup come from one component.
const Application = ({ snapshot, router: RouterComponent = TransitionRouter, routerProps = {} }) => (
  <MotionPreference>
    <RouterComponent {...routerProps}>
      <PageTracker />
      <App snapshot={snapshot} />
    </RouterComponent>
  </MotionPreference>
);

export default Application;
