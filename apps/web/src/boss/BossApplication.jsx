import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import BossLayout from '@/boss/BossLayout';
import BossDashboard from '@/boss/pages/Dashboard';
import BossAnalytics from '@/boss/pages/Analytics';
import BossContent from '@/boss/pages/Content';
import BossSubmissions from '@/boss/pages/Submissions';
import BossAudit from '@/boss/pages/Audit';
import BossSystem from '@/boss/pages/System';

const BossApplication = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/boss" element={<BossLayout />}>
        <Route index element={<BossDashboard />} />
        <Route path="analytics" element={<BossAnalytics />} />
        <Route path="content" element={<BossContent />} />
        <Route path="submissions" element={<BossSubmissions />} />
        <Route path="audit" element={<BossAudit />} />
        <Route path="system" element={<BossSystem />} />
        <Route path="*" element={<Navigate to="/boss" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default BossApplication;
