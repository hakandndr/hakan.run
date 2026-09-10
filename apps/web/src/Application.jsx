import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import PageTracker from '@/components/PageTracker';
import { ContentProvider } from '@/contexts/ContentContext';



const Application = () => (
  <BrowserRouter>
    <ContentProvider>
      <PageTracker />
      <App />
    </ContentProvider>
  </BrowserRouter>
);


export default Application;
