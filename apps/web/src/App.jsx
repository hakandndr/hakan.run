import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Contact from '@/pages/Contact';
import Project from '@/pages/Project';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';
import { AnimatePresence } from 'framer-motion';
import TerminalLoader from '@/components/TerminalLoader';
import KonamiEasterEgg from '@/components/KonamiEasterEgg';

const alreadyBooted = !!sessionStorage.getItem('booted');

function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(!alreadyBooted);

  const handleBootDone = () => {
    sessionStorage.setItem('booted', '1');
    setLoading(false);
  };

  return (
    <>
      <AnimatePresence>
        {loading && <TerminalLoader key="loader" onDone={handleBootDone} />}
      </AnimatePresence>

      {!loading && (
        <>
          <KonamiEasterEgg />
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="contact" element={<Contact />} />
                <Route path="project/:projectId" element={<Project />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="/control-room" element={<Admin />} />
              <Route path="/admin" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </>
      )}
    </>
  );
}

export default App;
