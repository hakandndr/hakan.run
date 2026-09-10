import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicFrame } from '@/public/PublicRenderer';

const Layout = ({ navigationType }) => {
  return <PublicFrame navigationType={navigationType} interactive><Outlet /></PublicFrame>;
};

export default Layout;
