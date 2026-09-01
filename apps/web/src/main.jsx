import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import ScrollToTop from '@/components/ScrollToTop';
import { ContentProvider } from '@/contexts/ContentContext';
import '@/index.css';

const rootElement = document.getElementById('root');

const app = (
  <BrowserRouter>
    <ContentProvider>
      <ScrollToTop />
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
