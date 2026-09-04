import React from 'react';
import { useBossResource } from '../useBossResource.js';
import { LoadingState, ErrorState, EmptyState } from '../components/StateBlock.jsx';
import { Panel, DataTable } from '../components/Panel.jsx';

const instant = (value) =>
  value ? new Date(Number(value)).toISOString().replace('T', ' ').slice(0, 16) : '—';

const Submissions = () => {
  const { status, data, error, reload } = useBossResource('/api/boss/submissions');

  if (status === 'loading') return <LoadingState label="reading /api/boss/submissions" />;
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />;

  const submissions = data.submissions ?? [];

  return (
    <Panel
      title="Submissions"
      hint="Persisted before any notification is attempted; notification state never gates acceptance"
    >
      {submissions.length === 0 ? (
        <EmptyState message="No submissions recorded in this environment yet." />
      ) : (
        <DataTable
          columns={[
            { key: 'received_at', label: 'Received', render: (row) => instant(row.received_at) },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'source_path', label: 'From' },
            { key: 'country', label: 'Country', render: (row) => row.country ?? '—' },
            { key: 'status', label: 'Status' },
            {
              key: 'notification_state',
              label: 'Notification',
              render: (row) =>
                row.notification_error
                  ? `${row.notification_state} (${row.notification_error})`
                  : row.notification_state,
            },
          ]}
          rows={submissions}
          rowKey={(row) => row.id}
        />
      )}
    </Panel>
  );
};

export default Submissions;
