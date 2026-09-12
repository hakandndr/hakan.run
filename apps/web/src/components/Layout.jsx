import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicPageShell } from '@/public/PublicRenderer';
import ScrollManager from '@/components/ScrollManager';

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
