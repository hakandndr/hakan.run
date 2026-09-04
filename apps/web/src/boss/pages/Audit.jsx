import React from 'react';
import { useBossResource } from '../useBossResource.js';
import { LoadingState, ErrorState, EmptyState } from '../components/StateBlock.jsx';
import { Panel, DataTable } from '../components/Panel.jsx';

const instant = (value) =>
  value ? new Date(Number(value)).toISOString().replace('T', ' ').slice(0, 19) : '—';

const Audit = () => {
  const { status, data, error, reload } = useBossResource('/api/boss/audit');

  if (status === 'loading') return <LoadingState label="reading /api/boss/audit" />;
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />;

  const events = data.events ?? [];

  return (
    <Panel
      title="Audit trail"
      hint="Written by the Worker only, newest first"
    >
      {events.length === 0 ? (
        <EmptyState message="No privileged actions recorded in this environment yet." />
      ) : (
        <DataTable
          columns={[
            { key: 'occurred_at', label: 'When', render: (row) => instant(row.occurred_at) },
            { key: 'actor', label: 'Actor' },
            { key: 'action', label: 'Action' },
            { key: 'object_type', label: 'Object' },
            { key: 'object_id', label: 'Id', render: (row) => row.object_id ?? '—' },
            { key: 'detail', label: 'Detail', render: (row) => row.detail ?? '—' },
          ]}
          rows={events}
          rowKey={(row) => row.id}
        />
      )}
    </Panel>
  );
};

export default Audit;
