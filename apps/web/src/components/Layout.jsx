import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScrollManager from '@/components/ScrollManager';
import { Toaster } from '@/components/ui/toaster';

const Layout = ({ navigationType }) => {
  return (
    <div className="min-h-screen text-white overflow-x-hidden flex flex-col" style={{ backgroundColor: '#090909' }}>
      <ScrollManager navigationType={navigationType} />
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
};

export default Layout;
