import React from 'react';
import { Link } from 'react-router-dom';
import { useBossResource } from '../useBossResource.js';
import { LoadingState, ErrorState } from '../components/StateBlock.jsx';
import { Panel, StatGrid } from '../components/Panel.jsx';

const formatInstant = (value) =>
  value ? new Date(Number(value)).toISOString().replace('T', ' ').slice(0, 19) : 'none recorded';

const Dashboard = () => {
  const { status, data, error, reload } = useBossResource('/api/boss/dashboard');

  if (status === 'loading') return <LoadingState label="reading /api/boss/dashboard" />;
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <Panel title="Operational state" hint="Live from APP_DB and ANALYTICS_DB">
        <StatGrid
          items={[
            { label: 'Environment', value: data.environment ?? 'unknown' },
            {
              label: 'Pending submissions',
              value: data.pendingSubmissions,
              note: 'Records with status "new"',
            },
            { label: 'Audit events', value: data.auditEvents, note: 'Privileged actions recorded' },
            {
              label: 'Oldest analytics event',
              value: formatInstant(data.oldestAnalyticsEvent),
              note: 'Raw detail is removed only by an audited operator action',
            },
          ]}
        />
      </Panel>

      <Panel title="Where to go next" hint="Every figure above has a module that owns it">
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-sm">
          <li>
            <Link to="/boss/submissions" className="block border border-white/10 bg-[#151515] rounded px-4 py-3 text-gray-300 hover:border-accent-purple/40 hover:text-white transition-colors">
              <span className="text-accent-purple select-none">&#10095;</span> submissions
            </Link>
          </li>
          <li>
            <Link to="/boss/analytics" className="block border border-white/10 bg-[#151515] rounded px-4 py-3 text-gray-300 hover:border-accent-purple/40 hover:text-white transition-colors">
              <span className="text-accent-purple select-none">&#10095;</span> analytics
            </Link>
          </li>
          <li>
            <Link to="/boss/system" className="block border border-white/10 bg-[#151515] rounded px-4 py-3 text-gray-300 hover:border-accent-purple/40 hover:text-white transition-colors">
              <span className="text-accent-purple select-none">&#10095;</span> system
            </Link>
          </li>
        </ul>
      </Panel>
    </>
  );
};

export default Dashboard;
