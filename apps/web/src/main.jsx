import React from 'react';
import { flushSync } from 'react-dom';
import ReactDOM from 'react-dom/client';
import Application from './Application.jsx';
import '@/index.css';

// Load the private renderer without mounting public providers or trackers.
const preview = window.location.pathname === '/boss/content/preview';

const mount = (Component) => {
  const root = document.getElementById('root');
  if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, <Component />);
  else {
    const reactRoot = ReactDOM.createRoot(root);
    // Public bootstrap must complete before the module and window load event
    // finish so native document restoration sees the full page height.
    flushSync(() => reactRoot.render(<Component />));
  }
};

if (preview) {
  import('./boss/PreviewPage.jsx').then(({ default: PreviewPage }) => mount(PreviewPage));
} else {
  mount(Application);
}
