import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicPageShell } from '@/public/PublicRenderer';
import ScrollManager from '@/components/ScrollManager';
import { useCanonicalUrl } from '@/head/useCanonicalUrl';
import { publicCanonicalUrl } from '@/head/document-head';

const Layout = ({ navigationType, routeLocation, snapshot }) => {
  useCanonicalUrl(publicCanonicalUrl(routeLocation.pathname));
  return (
    <>
      <ScrollManager navigationType={navigationType} location={routeLocation} />
      {routeLocation.pathname === '/card' ? (
        <Outlet />
      ) : (
        <PublicPageShell header={snapshot.content.header} footer={snapshot.content.footer} interactive>
          <Outlet />
        </PublicPageShell>
      )}
    </>
  );
};

export default Layout;
