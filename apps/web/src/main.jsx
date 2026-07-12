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

// hydrate when the HTML was pre-rendered (react-snap), otherwise mount fresh
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}