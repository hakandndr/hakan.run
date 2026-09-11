import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicPageShell } from '@/public/PublicRenderer';
import ScrollManager from '@/components/ScrollManager';

const Layout = ({ navigationType, routeLocation, snapshot }) => (
  <>
    <ScrollManager navigationType={navigationType} location={routeLocation} />
    <PublicPageShell header={snapshot.content.header} interactive>
      <Outlet />
    </PublicPageShell>
  </>
);

export default Layout;
