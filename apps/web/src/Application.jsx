import React from 'react';
import App from '@/App';
import PageTracker from '@/components/PageTracker';
import TransitionRouter from '@/router/TransitionRouter';

const Application = ({ snapshot }) => (
  <TransitionRouter>
    <PageTracker />
    <App snapshot={snapshot} />
  </TransitionRouter>
);


export default Application;
