import React, { useEffect, useMemo, useState } from 'react';
import { useBossResource } from '../useBossResource.js';
import { LoadingState, ErrorState, EmptyState } from '../components/StateBlock.jsx';
import { DataTable } from '../components/Panel.jsx';
import { EMPTY_FILTERS, PAGE_SIZES, buildEventsPath } from './eventStreamPath.js';

// Analytics V3 stays authoritative in the Worker.
//
// The browser does not recompute totals, coverage, ordering or ordinals.
// It only asks for one view of the data and renders the answer.
//
// The page is intentionally structured as an operational surface:
// compact summary first, raw event stream immediately after it, and
// secondary diagnostic information below the stream.

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
  'w-full bg-[#111111] border border-white/10 rounded px-3 py-2 font-mono text-xs text-gray-200 ' +
  'placeholder:text-gray-700 focus:outline-none focus:border-accent-purple/60';

const secondaryButtonClass =
  'font-mono text-xs text-gray-300 border border-white/10 hover:bg-white/5 ' +
  'disabled:opacity-30 disabled:hover:bg-transparent px-3 py-2 rounded transition-colors';

const primaryButtonClass =
  'font-mono text-xs text-accent-purple border border-accent-purple/30 ' +
  'hover:bg-accent-purple/10 px-3 py-2 rounded transition-colors';

const Field = ({ id, label, children }) => (
  <div>
    <label
      htmlFor={id}
      className="block font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-1.5"
    >
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
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={controlClass}
    >
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
  {
    key: 'occurred_at',
    label: 'Date (PT)',
    render: (row) => formatInstant(row.occurred_at),
  },
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
    render: (row) =>
      [row.device_class, row.browser_family].filter(Boolean).join(' / ') || '—',
  },
];

const CompactStat = ({ label, value, note }) => (
  <div className="min-w-0 px-4 py-3 border-r border-white/10 last:border-r-0">
    <p className="font-mono text-[9px] uppercase tracking-wider text-gray-600 truncate">
      {label}
    </p>
    <p className="font-mono text-lg text-white mt-1">{value ?? '—'}</p>
    {note ? (
      <p className="font-mono text-[9px] text-gray-700 mt-1 truncate">{note}</p>
    ) : null}
  </div>
);

const CompactSummary = ({ data }) => {
  const { totals, coverage, range, topPages, timeZone } = data;

  return (
    <div className="space-y-3 mb-5">
      <div className="border border-white/10 bg-[#111111] rounded overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7">
          <CompactStat label="Events" value={totals.events} />
          <CompactStat label="Today" value={totals.today} />
          <CompactStat label="Unique addresses" value={totals.uniqueAddresses} />
          <CompactStat label="Human" value={totals.human} />
          <CompactStat label="Automated" value={totals.automated} />
          <CompactStat label="Raw days" value={coverage.rawDays.length} />
          <CompactStat label="Aggregate days" value={coverage.aggregateDays.length} />
        </div>

        <div className="border-t border-white/10 px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-gray-600">
            Range
          </span>
          <span className="font-mono text-[10px] text-gray-500">
            {range.from} → {range.to}
          </span>
          <span className="font-mono text-[10px] text-gray-700">·</span>
          <span className="font-mono text-[10px] text-gray-500">{timeZone}</span>
        </div>
      </div>

      <div className="border border-white/10 bg-[#111111] rounded px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-gray-600 mr-2">
            Top pages
          </span>

          {topPages.length === 0 ? (
            <span className="font-mono text-[10px] text-gray-600">
              No page events in this range.
            </span>
          ) : (
            topPages.map((row) => (
              <span
                key={row.label}
                className="inline-flex items-center gap-2 border border-white/10 bg-[#0c0c0c] rounded px-2.5 py-1.5"
              >
                <span className="font-mono text-[10px] text-accent-purple">
                  {row.label}
                </span>
                <span className="font-mono text-[10px] text-gray-500">
                  {row.value}
                </span>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const PaginationControls = ({
  page,
  lastPage,
  limit,
  total,
  pageInput,
  setPageInput,
  goToPage,
  changeLimit,
}) => {
  const submitPage = (event) => {
    event.preventDefault();
    goToPage(pageInput);
  };

  return (
    <div className="border border-white/10 bg-[#111111] rounded px-3 py-2.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="stream-limit"
            className="font-mono text-[10px] uppercase tracking-wider text-gray-600"
          >
            Rows
          </label>
          <select
            id="stream-limit"
            value={limit}
            onChange={(event) => changeLimit(event.target.value)}
            className="bg-[#0c0c0c] border border-white/10 rounded px-2.5 py-1.5 font-mono text-xs text-gray-200 focus:outline-none focus:border-accent-purple/60"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <span className="font-mono text-[10px] text-gray-600">
          {total} records
        </span>

        <span className="font-mono text-[10px] text-gray-500">
          Page <span className="text-gray-300">{page}</span> of{' '}
          <span className="text-gray-300">{lastPage}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goToPage(1)}
          className={secondaryButtonClass}
        >
          First
        </button>

        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          className={secondaryButtonClass}
        >
          Previous
        </button>

        <form onSubmit={submitPage} className="flex items-center gap-2">
          <label
            htmlFor="stream-page-jump"
            className="font-mono text-[10px] uppercase tracking-wider text-gray-600"
          >
            Page
          </label>

          <input
            id="stream-page-jump"
            type="number"
            min="1"
            max={lastPage}
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            className="w-20 bg-[#0c0c0c] border border-white/10 rounded px-2.5 py-1.5 font-mono text-xs text-gray-200 focus:outline-none focus:border-accent-purple/60"
          />

          <button type="submit" className={primaryButtonClass}>
            Go
          </button>
        </form>

        <button
          type="button"
          disabled={page >= lastPage}
          onClick={() => goToPage(page + 1)}
          className={secondaryButtonClass}
        >
          Next
        </button>

        <button
          type="button"
          disabled={page >= lastPage}
          onClick={() => goToPage(lastPage)}
          className={secondaryButtonClass}
        >
          Last
        </button>
      </div>
    </div>
  );
};

const EventStream = () => {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [limit, setLimit] = useState(PAGE_SIZES[1]);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
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

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const set = (key) => (value) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const events = stream.data?.events ?? [];
  const lastPage = Math.max(1, Math.ceil(total / limit));

  const goToPage = (value) => {
    const requested = Number(value);
    if (!Number.isFinite(requested)) {
      setPageInput(String(page));
      return;
    }

    const nextPage = Math.min(lastPage, Math.max(1, Math.trunc(requested)));
    setPage(nextPage);
    setPageInput(String(nextPage));
  };

  const apply = (event) => {
    event.preventDefault();
    setApplied(draft);
    setPage(1);
    setPageInput('1');
    setKnownTotal(null);
  };

  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
    setPageInput('1');
    setKnownTotal(null);
  };

  const changeLimit = (value) => {
    setLimit(Number(value));
    setPage(1);
    setPageInput('1');
  };

  const quickSource = (source) => {
    const next = { ...draft, source };
    setDraft(next);
    setApplied(next);
    setPage(1);
    setPageInput('1');
    setKnownTotal(null);
  };

  return (
    <section className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div>
          <h2 className="font-mono text-sm uppercase tracking-wider text-white">
            Page visit stream
          </h2>
          <p className="font-mono text-[10px] text-gray-600 mt-1">
            Raw PAGE events · newest first · Worker API source of truth
          </p>
        </div>

        <div className="font-mono text-[10px] text-gray-500">
          <span className="text-gray-300">{total}</span> records
        </div>
      </div>

      <div className="border border-white/10 bg-[#111111] rounded overflow-hidden mb-3">
        <div className="border-b border-white/10 px-3 py-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-gray-600 mr-1">
            Source
          </span>

          {SOURCES.map((source) => {
            const active = applied.source === source.value;

            return (
              <button
                key={source.value || 'all'}
                type="button"
                onClick={() => quickSource(source.value)}
                className={
                  active
                    ? 'font-mono text-[10px] text-accent-purple border border-accent-purple/40 bg-accent-purple/10 rounded px-3 py-1.5'
                    : 'font-mono text-[10px] text-gray-500 border border-white/10 hover:text-gray-300 hover:bg-white/5 rounded px-3 py-1.5'
                }
              >
                {source.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={apply} className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <TextField
              id="stream-ip"
              label="IP"
              value={draft.ip}
              placeholder="203.0.113."
              onChange={set('ip')}
            />

            <TextField
              id="stream-country"
              label="Country"
              value={draft.country}
              placeholder="US"
              onChange={set('country')}
            />

            <TextField
              id="stream-city"
              label="City"
              value={draft.city}
              placeholder="Irvine"
              onChange={set('city')}
            />

            <TextField
              id="stream-path"
              label="Page"
              value={draft.path}
              placeholder="/projects"
              onChange={set('path')}
            />

            <TextField
              id="stream-referrer"
              label="Referrer"
              value={draft.referrer}
              placeholder="google.com"
              onChange={set('referrer')}
            />

            <TextField
              id="stream-browser"
              label="Browser"
              value={draft.browser}
              placeholder="Chrome"
              onChange={set('browser')}
            />

            <SelectField
              id="stream-actor"
              label="Actor"
              value={draft.actor}
              options={ACTORS}
              onChange={set('actor')}
            />

            <SelectField
              id="stream-source"
              label="Source"
              value={draft.source}
              options={SOURCES}
              onChange={set('source')}
            />

            <DateField
              id="stream-from"
              label="From"
              value={draft.from}
              onChange={set('from')}
            />

            <DateField
              id="stream-to"
              label="To"
              value={draft.to}
              onChange={set('to')}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
            <button type="button" onClick={reset} className={secondaryButtonClass}>
              Reset filters
            </button>

            <button type="submit" className={primaryButtonClass}>
              <span className="opacity-50 select-none">$</span> Apply filters
            </button>
          </div>
        </form>
      </div>

      {stream.status === 'loading' ? (
        <LoadingState label="reading /api/boss/analytics/events" />
      ) : stream.status === 'error' ? (
        <ErrorState error={stream.error} onRetry={stream.reload} />
      ) : events.length === 0 ? (
        <EmptyState message="No page events match these filters." />
      ) : (
        <>
          <div className="mb-3">
            <DataTable
              columns={STREAM_COLUMNS}
              rows={events}
              rowKey={(row) => row.id}
            />
          </div>

          <PaginationControls
            page={page}
            lastPage={lastPage}
            limit={limit}
            total={total}
            pageInput={pageInput}
            setPageInput={setPageInput}
            goToPage={goToPage}
            changeLimit={changeLimit}
          />
        </>
      )}
    </section>
  );
};

const AnalyticsDetails = ({ data }) => {
  const { coverage, countries, range, timeZone } = data;

  return (
    <details className="border border-white/10 bg-[#111111] rounded mb-6">
      <summary className="cursor-pointer select-none px-4 py-3 font-mono text-xs text-gray-400 hover:text-gray-200">
        <span className="text-accent-purple mr-2">›</span>
        Analytics details
        <span className="text-gray-700 ml-2">
          coverage, countries and range diagnostics
        </span>
      </summary>

      <div className="border-t border-white/10 p-4 space-y-5">
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-3">
            Coverage
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CompactStat
              label="Aggregate days"
              value={coverage.aggregateDays.length}
            />
            <CompactStat label="Raw days" value={coverage.rawDays.length} />
            <CompactStat
              label="Aggregates suppressed"
              value={coverage.aggregateSuppressedByFilter ? 'yes' : 'no'}
            />
            <CompactStat
              label="Time zone"
              value={timeZone}
              note={`${range.from} → ${range.to}`}
            />
          </div>
        </div>

        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-wider text-gray-500 mb-3">
            Countries
          </h3>

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
        </div>
      </div>
    </details>
  );
};

const Analytics = () => {
  const summary = useBossResource('/api/boss/analytics/summary');

  return (
    <>
      {summary.status === 'loading' ? (
        <div className="mb-5">
          <LoadingState label="reading /api/boss/analytics/summary" />
        </div>
      ) : summary.status === 'error' ? (
        <div className="mb-5">
          <ErrorState error={summary.error} onRetry={summary.reload} />
        </div>
      ) : (
        <CompactSummary data={summary.data} />
      )}

      <EventStream />

      {summary.status === 'ready' ? (
        <AnalyticsDetails data={summary.data} />
      ) : null}
    </>
  );
};

export default Analytics;