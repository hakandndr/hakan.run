import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Contact from '@/pages/Contact';
import { Toaster } from '@/components/ui/toaster';

export const PublicFrame = ({ children, interactive = false }) => (
  <div className="min-h-screen text-white overflow-x-hidden flex flex-col" style={{ backgroundColor: '#090909' }}>
    <Header />
    <main className="flex-grow">{children}</main>
    <Footer />
    {interactive && <Toaster />}
  </div>
);

export const PublicPreviewRenderer = ({ page }) => (
  <PublicFrame>{page === 'contact' ? <Contact /> : <Home />}</PublicFrame>
);
