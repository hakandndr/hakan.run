import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicPageShell } from '@/public/PublicRenderer';
import ScrollManager from '@/components/ScrollManager';

// Each route declares its own canonical URL (useCanonicalUrl), so a path the
// layout wraps but no page owns, the 404, names none.
const Layout = ({ navigationType, routeLocation, snapshot }) => (
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

export default Layout;
