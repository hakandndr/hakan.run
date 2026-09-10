import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/index.css';
// Load the private renderer without mounting public providers or trackers.
const preview = window.location.pathname === '/boss/content/preview';

// The public application is loaded asynchronously, so the document has no
// scrollable height when native restoration runs. ScrollToTop owns refresh
// restoration after the application has mounted instead.
if (!preview && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const load = preview ? import('./boss/PreviewPage.jsx') : import('./Application.jsx');
load.then(({ default: Component }) => {
  const root = document.getElementById('root');
  if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, <Component />);
  else ReactDOM.createRoot(root).render(<Component />);
});
