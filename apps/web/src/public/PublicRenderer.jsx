import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Contact from '@/pages/Contact';
import ScrollManager from '@/components/ScrollManager';
import { Toaster } from '@/components/ui/toaster';

export const PublicFrame = ({ children, navigationType, interactive = false }) => (
  <div className="min-h-screen text-white overflow-x-hidden flex flex-col" style={{ backgroundColor: '#090909' }}>
    {interactive && <ScrollManager navigationType={navigationType} />}
    <Header />
    <main className="flex-grow">{children}</main>
    <Footer />
    {interactive && <Toaster />}
  </div>
);

export const PublicPreviewRenderer = ({ page }) => (
  <PublicFrame>{page === 'contact' ? <Contact /> : <Home />}</PublicFrame>
);
