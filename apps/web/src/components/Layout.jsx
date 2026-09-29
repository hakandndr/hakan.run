import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PublicPageShell } from '@/public/PublicRenderer';
import ScrollManager from '@/components/ScrollManager';
import { useCanonicalUrl } from '@/head/useCanonicalUrl';

const isNotesPath = (pathname) => pathname === '/notes' || pathname.startsWith('/notes/');

// The pathname this application instance last committed. It is null until the
// first route commits, so a document load (including direct-open prerendered
// Notes HTML) never animates; only in-app navigation into Notes does.
let committedPathname = null;

const Layout = ({ navigationType, routeLocation, snapshot }) => {
  useCanonicalUrl(`https://hakan.run${routeLocation.pathname}`);
  // App keys the route tree by pathname, so this initializer runs once per
  // pathname change. Hash-only homepage navigation keeps its existing motion.
  const [entering] = useState(() => committedPathname !== null
    && committedPathname !== routeLocation.pathname
    && isNotesPath(routeLocation.pathname));

  useEffect(() => {
    committedPathname = routeLocation.pathname;
  }, [routeLocation.pathname]);

  return (
    <>
      <ScrollManager navigationType={navigationType} location={routeLocation} />
      {routeLocation.pathname === '/card' ? (
        <Outlet />
      ) : (
        <PublicPageShell header={snapshot.content.header} footer={snapshot.content.footer} interactive>
          <div className={entering ? 'route-enter' : undefined} data-route-enter={entering ? 'notes' : undefined}>
            <Outlet />
          </div>
        </PublicPageShell>
      )}
    </>
  );
};

export default Layout;
