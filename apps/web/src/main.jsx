import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import ScrollRestoration from '@/components/ScrollRestoration';
import { ContentProvider } from '@/contexts/ContentContext';
import '@/index.css';

// Native scroll restoration can fire before this client-rendered document has
// any height, which reopens a refreshed page at the top. Position handling is
// owned by ScrollRestoration instead.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const rootElement = document.getElementById('root');

const app = (
  <BrowserRouter>
    <ContentProvider>
      <ScrollRestoration />
      <App />
    </ContentProvider>
  </BrowserRouter>
);

// Hydrate existing root markup when present; otherwise mount the client app.
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}
