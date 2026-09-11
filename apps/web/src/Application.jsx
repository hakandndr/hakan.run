import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import PageTracker from '@/components/PageTracker';

const Application = ({ snapshot }) => (
  <BrowserRouter>
    <PageTracker />
    <App snapshot={snapshot} />
  </BrowserRouter>
);


export default Application;
