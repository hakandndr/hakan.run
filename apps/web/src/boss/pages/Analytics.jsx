import React from 'react';
import { useBossResource } from '../useBossResource.js';
import { LoadingState, ErrorState, EmptyState } from '../components/StateBlock.jsx';
import { Panel, StatGrid, DataTable } from '../components/Panel.jsx';

// Reads the Boss analytics API that already exists. No summing, merging or
// coverage logic lives here: the Worker owns Analytics V3, and a second
// implementation in the browser would be a second answer to the same question.

const Analytics = () => {
  const summary = useBossResource('/api/boss/analytics/summary');

  if (summary.status === 'loading') return <LoadingState label="reading /api/boss/analytics/summary" />;
  if (summary.status === 'error') return <ErrorState error={summary.error} onRetry={summary.reload} />;

  const { totals, coverage, range, topPages, countries, timeZone } = summary.data;

  return (
    <>
      <Panel
        title="Totals"
        hint={`${range.from} to ${range.to} · local days in ${timeZone}`}
      >
        <StatGrid
          items={[
            { label: 'Events', value: totals.events },
            { label: 'Human', value: totals.human, note: 'Automated traffic counted separately' },
            { label: 'Automated', value: totals.automated },
            { label: 'Today', value: totals.today, note: 'The current local day is always read raw' },
          ]}
        />
      </Panel>

      <Panel title="Coverage" hint="Aggregates are read only for days an explicit ledger marks as covered">
        <StatGrid
          items={[
            { label: 'Aggregate days', value: coverage.aggregateDays.length },
            { label: 'Raw days', value: coverage.rawDays.length },
            {
              label: 'Unique addresses',
              value: totals.uniqueAddresses,
              note: 'Exact, counted across the whole range',
            },
            {
              label: 'Aggregates suppressed',
              value: coverage.aggregateSuppressedByFilter ? 'yes' : 'no',
              note: 'A filter aggregates cannot express forces raw reads',
            },
          ]}
        />
      </Panel>

      <Panel title="Top pages" hint="Merged from both sources before truncation">
        {topPages.length === 0 ? (
          <EmptyState message="No page events in this range yet." />
        ) : (
          <DataTable
            columns={[
              { key: 'label', label: 'Path' },
              { key: 'count', label: 'Events' },
            ]}
            rows={topPages}
            rowKey={(row) => row.label}
          />
        )}
      </Panel>

      <Panel title="Countries">
        {countries.length === 0 ? (
          <EmptyState message="No country data in this range yet." />
        ) : (
          <DataTable
            columns={[
              { key: 'label', label: 'Country' },
              { key: 'count', label: 'Events' },
            ]}
            rows={countries}
            rowKey={(row) => row.label}
          />
        )}
      </Panel>
    </>
  );
};

export default Analytics;
