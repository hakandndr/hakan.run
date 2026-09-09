import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import ScrollToTop from '@/components/ScrollToTop';
import PageTracker from '@/components/PageTracker';
import { ContentProvider } from '@/contexts/ContentContext';



const Application = () => (
  <BrowserRouter>
    <ContentProvider>
      <ScrollToTop />
      <PageTracker />
      <App />
    </ContentProvider>
  </BrowserRouter>
);


export default Application;
