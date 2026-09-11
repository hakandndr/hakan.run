import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
import Layout from '@/components/Layout';
import PublicHome from '@/public/PublicHome';
import PublicContact from '@/public/components/PublicContact';
import NotFound from '@/pages/NotFound';
import { AnimatePresence } from 'framer-motion';
import KonamiEasterEgg from '@/components/KonamiEasterEgg';

function App({ snapshot }) {
  const location = useLocation();
  const navigationType = useNavigationType();

  return (
    <>
      <KonamiEasterEgg />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={<Layout navigationType={navigationType} routeLocation={location} snapshot={snapshot} />}
          >
            <Route index element={<PublicHome snapshot={snapshot} />} />
            <Route path="contact" element={<PublicContact contact={snapshot.content.contact} />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/admin" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
