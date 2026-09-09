import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/index.css';
// Load the private renderer without mounting public providers or trackers.
const preview = window.location.pathname === '/boss/content/preview';
const load = preview ? import('./boss/PreviewPage.jsx') : import('./Application.jsx');
load.then(({ default: Component }) => {
  const root = document.getElementById('root');
  if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, <Component />);
  else ReactDOM.createRoot(root).render(<Component />);
});
