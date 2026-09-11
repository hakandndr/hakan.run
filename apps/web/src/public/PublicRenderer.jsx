import React from 'react';
import Footer from '@/components/Footer';
import Contact from '@/pages/Contact';
import { Toaster } from '@/components/ui/toaster';
import PublicHeader from '@/public/components/PublicHeader';
import PublicHome from '@/public/PublicHome';

export const PublicPageShell = ({ header, children, interactive = false }) => (
  <div className="min-h-screen text-white overflow-x-hidden flex flex-col" style={{ backgroundColor: '#090909' }}>
    <PublicHeader header={header} />
    <main className="flex-grow">{children}</main>
    <Footer />
    {interactive && <Toaster />}
  </div>
);

export const PublicPreviewRenderer = ({ page, snapshot }) => (
  <PublicPageShell header={snapshot.content.header}>
    {page === 'contact' ? <Contact /> : <PublicHome snapshot={snapshot} />}
  </PublicPageShell>
);
