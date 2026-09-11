import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import PublicContact from '@/public/components/PublicContact';
import PublicFooter from '@/public/components/PublicFooter';
import PublicHeader from '@/public/components/PublicHeader';
import PublicHome from '@/public/PublicHome';

export const PublicPageShell = ({ header, footer, children, interactive = false }) => (
  <div className="min-h-screen text-white overflow-x-hidden flex flex-col" style={{ backgroundColor: '#090909' }}>
    <PublicHeader header={header} />
    <main className="flex-grow">{children}</main>
    <PublicFooter footer={footer} />
    {interactive && <Toaster />}
  </div>
);

export const PublicPreviewRenderer = ({ page, snapshot }) => (
  <PublicPageShell header={snapshot.content.header} footer={snapshot.content.footer}>
    {page === 'contact'
      ? <PublicContact contact={snapshot.content.contact} preview />
      : <PublicHome snapshot={snapshot} />}
  </PublicPageShell>
);
