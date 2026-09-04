import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Contact from '@/pages/Contact';
import Project from '@/pages/Project';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';
import BossLayout from '@/boss/BossLayout';
import BossDashboard from '@/boss/pages/Dashboard';
import BossAnalytics from '@/boss/pages/Analytics';
import BossContent from '@/boss/pages/Content';
import BossSubmissions from '@/boss/pages/Submissions';
import BossAudit from '@/boss/pages/Audit';
import BossSystem from '@/boss/pages/System';
import { isBossPath } from '@/boss/sections';
import { AnimatePresence } from 'framer-motion';
import TerminalLoader from '@/components/TerminalLoader';
import KonamiEasterEgg from '@/components/KonamiEasterEgg';

const alreadyBooted = !!sessionStorage.getItem('booted');

function App() {
  const location = useLocation();
  // The boot animation belongs to the public site. The private surface is a
  // tool, and an operator opening it does not want a title sequence.
  const [loading, setLoading] = useState(!alreadyBooted && !isBossPath(location.pathname));

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
              {/* The private surface. Outside the public Layout on purpose: no
                  public header, footer or navigation belongs inside Boss.
                  Cloudflare Access and the Worker's own verification are the
                  security boundary; nothing here authenticates. */}
              <Route path="/boss" element={<BossLayout />}>
                <Route index element={<BossDashboard />} />
                <Route path="analytics" element={<BossAnalytics />} />
                <Route path="content" element={<BossContent />} />
                <Route path="submissions" element={<BossSubmissions />} />
                <Route path="audit" element={<BossAudit />} />
                <Route path="system" element={<BossSystem />} />
                <Route path="*" element={<Navigate to="/boss" replace />} />
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
