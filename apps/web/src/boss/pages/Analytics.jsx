import React, { useEffect, useMemo, useState } from 'react';
import { useBossResource } from '../useBossResource.js';
import { LoadingState, ErrorState, EmptyState } from '../components/StateBlock.jsx';
import { Panel, StatGrid, DataTable } from '../components/Panel.jsx';
import { EMPTY_FILTERS, PAGE_SIZES, buildEventsPath } from './eventStreamPath.js';

// Reads the Boss analytics API that already exists. No summing, merging or
// coverage logic lives here: the Worker owns Analytics V3, and a second
// implementation in the browser would be a second answer to the same question.
//
// The raw stream below is the same rule applied again. Filtering, paging,
// ordering, the row ordinal and the per-day ordinal are all decided by
// /api/boss/analytics/events; this page states what it wants and renders what
// comes back. Nothing here recomputes a number the API already answered.

// The operational day boundary for the whole system (worker/lib/time.js).
// Repeated rather than imported because the Worker is not part of this bundle;
// it is a label on rendered instants, not a second source of day arithmetic.
const OPS_TIME_ZONE = 'America/Los_Angeles';

const SOURCES = [
  { value: '', label: 'All' },
  { value: 'native', label: 'native' },
  { value: 'legacy_panel', label: 'legacy_panel' },
];

const ACTORS = [
  { value: '', label: 'All' },
  { value: 'human', label: 'human' },
  { value: 'automated', label: 'automated' },
];

const timestamp = new Intl.DateTimeFormat('en-CA', {
  timeZone: OPS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const formatInstant = (value) => {
  const instant = Number(value);
  if (!Number.isFinite(instant)) return '—';
  return timestamp.format(new Date(instant)).replace(', ', ' ');
};

const controlClass =
  'w-full bg-[#151515] border border-white/10 rounded px-3 py-2 font-mono text-xs text-gray-200 ' +
  'placeholder:text-gray-700 focus:outline-none focus:border-accent-purple/60';

const Field = ({ id, label, children }) => (
  <div>
    <label htmlFor={id} className="block font-mono text-[11px] uppercase tracking-wider text-gray-500 mb-2">
      {label}
    </label>
    {children}
  </div>
);

const TextField = ({ id, label, value, placeholder, onChange }) => (
  <Field id={id} label={label}>
    <input
      id={id}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={controlClass}
    />
  </Field>
);

const SelectField = ({ id, label, value, options, onChange }) => (
  <Field id={id} label={label}>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={controlClass}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </Field>
);

const DateField = ({ id, label, value, onChange }) => (
  <Field id={id} label={label}>
    <input
      id={id}
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={controlClass}
    />
  </Field>
);

const STREAM_COLUMNS = [
  { key: 'rowNumber', label: '#' },
  { key: 'todayNumber', label: 'Today #' },
  { key: 'ip_address', label: 'IP Address' },
  { key: 'event_source', label: 'Source' },
  { key: 'actor_class', label: 'Actor' },
  { key: 'occurred_at', label: 'Date (PT)', render: (row) => formatInstant(row.occurred_at) },
  { key: 'country', label: 'Country' },
  {
    key: 'city',
    label: 'City / Region',
    render: (row) => [row.city, row.region].filter(Boolean).join(', ') || '—',
  },
  { key: 'path', label: 'Page' },
  { key: 'referrer_origin', label: 'Referrer' },
  {
    key: 'browser_family',
    label: 'Device / Browser',
    render: (row) => [row.device_class, row.browser_family].filter(Boolean).join(' / ') || '—',
  },
];

const EventStream = () => {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [limit, setLimit] = useState(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);
  // Held across page changes and dropped whenever the filter set changes, which
  // is exactly when the previous total stops describing the current query.
  const [knownTotal, setKnownTotal] = useState(null);

  const path = useMemo(
    () => buildEventsPath(applied, limit, page, knownTotal),
    [applied, limit, page, knownTotal],
  );
  const stream = useBossResource(path);

  const total = stream.data?.pagination?.total ?? knownTotal ?? 0;

  useEffect(() => {
    const reported = stream.data?.pagination?.total;
    if (Number.isSafeInteger(reported)) setKnownTotal(reported);
  }, [stream.data]);

  const set = (key) => (value) => setDraft((current) => ({ ...current, [key]: value }));

  const apply = (event) => {
    event.preventDefault();
    setApplied(draft);
    setPage(1);
    setKnownTotal(null);
  };

  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
    setKnownTotal(null);
  };

  const changeLimit = (value) => {
    setLimit(Number(value));
    setPage(1);
  };

  const events = stream.data?.events ?? [];
  const lastPage = Math.max(1, Math.ceil(total / limit));

  return (
    <Panel
      title="Page visit stream"
      hint="Raw events, newest first. Every figure is read from /api/boss/analytics/events"
    >
      <form onSubmit={apply} className="border border-white/10 bg-[#151515] rounded p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <TextField id="stream-ip" label="IP" value={draft.ip} placeholder="203.0.113." onChange={set('ip')} />
          <TextField id="stream-country" label="Country" value={draft.country} placeholder="US" onChange={set('country')} />
          <TextField id="stream-city" label="City" value={draft.city} placeholder="Irvine" onChange={set('city')} />
          <TextField id="stream-path" label="Page" value={draft.path} placeholder="/projects" onChange={set('path')} />
          <TextField id="stream-referrer" label="Referrer" value={draft.referrer} placeholder="google.com" onChange={set('referrer')} />
          <TextField id="stream-browser" label="Browser" value={draft.browser} placeholder="Chrome" onChange={set('browser')} />
          <SelectField id="stream-actor" label="Actor" value={draft.actor} options={ACTORS} onChange={set('actor')} />
          <SelectField id="stream-source" label="Source" value={draft.source} options={SOURCES} onChange={set('source')} />
          <DateField id="stream-from" label="From" value={draft.from} onChange={set('from')} />
          <DateField id="stream-to" label="To" value={draft.to} onChange={set('to')} />
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <button
            type="submit"
            className="font-mono text-xs text-accent-purple border border-accent-purple/30 hover:bg-accent-purple/10 px-4 py-2 rounded transition-colors"
          >
            <span className="opacity-50 select-none">$</span> Apply filters
          </button>
          <button
            type="button"
            onClick={reset}
            className="font-mono text-xs text-gray-400 border border-white/10 hover:bg-white/5 px-4 py-2 rounded transition-colors"
          >
            Reset filters
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 font-mono text-xs text-gray-500">
        <p>
          <span className="text-gray-300">{total}</span> total records
          {stream.status === 'ready' ? <span> &middot; page {page} of {lastPage}</span> : null}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="stream-limit" className="uppercase tracking-wider">
            Per page
          </label>
          <select
            id="stream-limit"
            value={limit}
            onChange={(event) => changeLimit(event.target.value)}
            className="bg-[#151515] border border-white/10 rounded px-3 py-2 font-mono text-xs text-gray-200 focus:outline-none focus:border-accent-purple/60"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {stream.status === 'loading' ? (
        <LoadingState label="reading /api/boss/analytics/events" />
      ) : stream.status === 'error' ? (
        <ErrorState error={stream.error} onRetry={stream.reload} />
      ) : events.length === 0 ? (
        <EmptyState message="No page events match these filters." />
      ) : (
        <>
          <DataTable columns={STREAM_COLUMNS} rows={events} rowKey={(row) => row.id} />
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="font-mono text-xs text-gray-300 border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent px-4 py-2 rounded transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((current) => current + 1)}
              className="font-mono text-xs text-gray-300 border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent px-4 py-2 rounded transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}
    </Panel>
  );
};

const Summary = () => {
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
              { key: 'value', label: 'Events' },
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
              { key: 'value', label: 'Events' },
            ]}
            rows={countries}
            rowKey={(row) => row.label}
          />
        )}
      </Panel>
    </>
  );
};

// The stream is rendered beside the summary rather than inside it: a failing
// summary read must not take the raw stream down with it, and the reverse.
// Each panel owns its own loading, empty and error state.
const Analytics = () => (
  <>
    <Summary />
    <EventStream />
  </>
);

export default Analytics;
