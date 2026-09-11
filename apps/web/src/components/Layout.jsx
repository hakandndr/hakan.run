import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicFrame } from '@/public/PublicRenderer';
import ScrollManager from '@/components/ScrollManager';

const Layout = ({ navigationType, routeLocation }) => (
  <>
    <ScrollManager navigationType={navigationType} location={routeLocation} />
    <PublicFrame interactive><Outlet /></PublicFrame>
  </>
);

export default Layout;
