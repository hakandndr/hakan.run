import React from 'react';
import { useBossResource } from '../useBossResource.js';
import { LoadingState, ErrorState, EmptyState } from '../components/StateBlock.jsx';
import { Panel, DataTable } from '../components/Panel.jsx';

const instant = (value) =>
  value ? new Date(Number(value)).toISOString().replace('T', ' ').slice(0, 16) : '—';

// Read-only for now. Editing arrives with the content authority phase; the
// module exists here so the section is real rather than a stub, and so the
// staging APP_DB's actual content state is visible before the bootstrap.

const Content = () => {
  const { status, data, error, reload } = useBossResource('/api/boss/content');

  if (status === 'loading') return <LoadingState label="reading /api/boss/content" />;
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />;

  const sections = data.sections ?? [];

  return (
    <Panel
      title="Content sections"
      hint="APP_DB is the content authority for this environment"
    >
      {sections.length === 0 ? (
        <EmptyState message="No content sections in this environment yet. The one-time bootstrap from authoritative production content has not been run." />
      ) : (
        <DataTable
          columns={[
            { key: 'section', label: 'Section' },
            { key: 'published_revision', label: 'Revision', render: (row) => row.published_revision ?? '—' },
            { key: 'published_at', label: 'Published', render: (row) => instant(row.published_at) },
            { key: 'draft_updated_at', label: 'Draft updated', render: (row) => instant(row.draft_updated_at) },
            { key: 'updated_at', label: 'Updated', render: (row) => instant(row.updated_at) },
          ]}
          rows={sections}
          rowKey={(row) => row.section}
        />
      )}
    </Panel>
  );
};

export default Content;
