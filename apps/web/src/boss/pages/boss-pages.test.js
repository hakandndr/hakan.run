// Contract regressions the live staging smoke found.
//
// These tests pin the browser to the API contracts that previously drifted
// silently. They intentionally assert field names and request semantics, but
// they do not freeze one particular visual layout.
//
// Analytics is now an operational surface: compact summary, raw event stream,
// direct pagination, and secondary diagnostics below the stream.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EMPTY_FILTERS,
  PAGE_SIZES,
  STREAM_FILTER_KEYS,
  buildEventsPath,
} from './eventStreamPath.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = (file) => readFileSync(path.join(here, file), 'utf8');

// --- Analytics: labelled counts are {label, value} --------------------------

test('analytics reads the labelled-count fields the API actually sends', () => {
  const analytics = source('Analytics.jsx');

  assert.ok(
    !/key: 'count'/.test(analytics),
    "analytics must never read a nonexistent 'count' field",
  );

  // Top pages are compact chips now, but they still consume the exact
  // {label, value} contract returned by the API.
  assert.match(analytics, /topPages\.map\(\(row\) =>/);
  assert.match(analytics, /key=\{row\.label\}/);
  assert.match(analytics, /\{row\.label\}/);
  assert.match(analytics, /\{row\.value\}/);

  // Countries remain a detail table and keep the explicit mapping.
  assert.match(analytics, /key: 'label', label: 'Country'/);
  assert.match(analytics, /key: 'value', label: 'Events'/);
});

test('analytics still labels the dimensions it renders', () => {
  const analytics = source('Analytics.jsx');

  assert.match(analytics, />\s*Top pages\s*</);
  assert.match(analytics, /key: 'label', label: 'Country'/);
});

// --- System: legacyAnalytics and eventSources are rendered ------------------

test('System renders the legacy history the API returns', () => {
  const system = source('System.jsx');

  assert.match(system, /legacyAnalytics/, 'the payload field must be read');
  assert.match(system, /Legacy analytics history/);
  assert.match(system, /legacy\.retainedEvents/);
  assert.match(system, /legacy\.oldestEventDay/);
  assert.match(system, /governedByRetentionPolicy/);
});

test('System renders the event-source breakdown', () => {
  const system = source('System.jsx');

  assert.match(system, /eventSources/);
  assert.match(system, /Event sources/);
  assert.match(system, /entry\.retainedEvents/);
});

test('the two histories stay separate on the page', () => {
  // Native retention keeps its own panel and overdue alert. Legacy history
  // remains separately reported and must not be folded into native retention.
  const system = source('System.jsx');

  const nativePanel = system.indexOf('analytics.retentionOverdue');
  const legacyPanel = system.indexOf('Legacy analytics history');

  assert.ok(nativePanel > 0 && legacyPanel > 0);
  assert.ok(
    nativePanel < legacyPanel,
    'native retention is reported first, in its own panel',
  );
  assert.match(system, /Not governed by the native retention policy/);
});

test('System tolerates a payload without the new fields', () => {
  // A Worker deployed before this change returns neither field. The page must
  // still render rather than treating deployment ordering as a fatal error.
  const system = source('System.jsx');

  assert.match(system, /data\.legacyAnalytics \?\? null/);
  assert.match(system, /data\.eventSources \?\? \[\]/);
});

// --- Analytics: the raw page-visit stream -----------------------------------
//
// The stream is a contract with /api/boss/analytics/events. These tests pin
// the raw field names, filter names, pagination semantics and source behavior.

test('the stream renders the columns the raw event API returns', () => {
  const analytics = source('Analytics.jsx');

  for (const [key, label] of [
    ['rowNumber', '#'],
    ['todayNumber', 'Today #'],
    ['ip_address', 'IP Address'],
    ['event_source', 'Source'],
    ['actor_class', 'Actor'],
    ['country', 'Country'],
    ['path', 'Page'],
    ['referrer_origin', 'Referrer'],
  ]) {
    assert.ok(
      analytics.includes(`key: '${key}', label: '${label}'`),
      `the stream must render ${label} from ${key}`,
    );
  }

  // occurred_at is formatted, so its declaration is intentionally multiline.
  assert.match(
    analytics,
    /key: 'occurred_at',[\s\S]*?label: 'Date \(PT\)'/,
  );
  assert.match(
    analytics,
    /formatInstant\(row\.occurred_at\)/,
    'Date (PT) must render from occurred_at',
  );

  // These two columns combine more than one field.
  for (const [label, fields] of [
    ['City / Region', ['row.city', 'row.region']],
    ['Device / Browser', ['row.device_class', 'row.browser_family']],
  ]) {
    assert.ok(
      analytics.includes(`label: '${label}'`),
      `${label} must be a column`,
    );

    for (const field of fields) {
      assert.ok(
        analytics.includes(field),
        `${label} must render ${field}`,
      );
    }
  }
});

test('the stream offers a control for every filter the endpoint accepts', () => {
  // Filter names are the query parameter names. A renamed client field would
  // otherwise be ignored silently by the Worker.
  const analytics = source('Analytics.jsx');

  for (const key of STREAM_FILTER_KEYS) {
    assert.match(
      analytics,
      new RegExp(`draft\\.${key}\\b`),
      `${key} must have a control`,
    );

    assert.match(
      analytics,
      new RegExp(`set\\('${key}'\\)`),
      `${key} must be editable`,
    );
  }
});

test('the source filter offers all, native and legacy_panel', () => {
  const analytics = source('Analytics.jsx');

  assert.match(analytics, /{ value: '', label: 'All' }/);
  assert.match(analytics, /value: 'native'/);
  assert.match(analytics, /value: 'legacy_panel'/);
});

test('the stream shows record count, page size and direct pagination controls', () => {
  const analytics = source('Analytics.jsx');

  assert.match(analytics, /\{total\} records/);
  assert.match(
    analytics,
    /PAGE_SIZES\.map/,
    'the page sizes are offered, not hard-coded in markup',
  );

  assert.match(analytics, />\s*First\s*</);
  assert.match(analytics, />\s*Previous\s*</);
  assert.match(analytics, />\s*Go\s*</);
  assert.match(analytics, />\s*Next\s*</);
  assert.match(analytics, />\s*Last\s*</);

  assert.match(analytics, /id="stream-page-jump"/);
  assert.match(analytics, /max=\{lastPage\}/);
  assert.match(analytics, /goToPage\(lastPage\)/);
});

// --- The request contract, executed rather than read ------------------------

test('the path carries every non-empty filter under its own name', () => {
  const requestPath = buildEventsPath(
    {
      ...EMPTY_FILTERS,
      ip: '203.0.113.7',
      source: 'legacy_panel',
      country: 'US',
      from: '2026-01-01',
    },
    50,
    1,
    null,
  );

  const params = new URL(
    requestPath,
    'https://staging.hakan.run',
  ).searchParams;

  assert.equal(params.get('ip'), '203.0.113.7');
  assert.equal(params.get('source'), 'legacy_panel');
  assert.equal(params.get('country'), 'US');
  assert.equal(params.get('from'), '2026-01-01');
  assert.equal(params.get('limit'), '50');
  assert.equal(params.get('page'), '1');
});

test('blank and whitespace-only filters are omitted, not sent empty', () => {
  const requestPath = buildEventsPath(
    {
      ...EMPTY_FILTERS,
      city: '   ',
      path: ' /projects ',
    },
    25,
    1,
    null,
  );

  const params = new URL(
    requestPath,
    'https://staging.hakan.run',
  ).searchParams;

  assert.equal(params.has('city'), false);
  assert.equal(params.get('path'), '/projects');

  // Every untouched filter stays out of the query entirely.
  assert.deepEqual(
    [...params.keys()].sort(),
    ['limit', 'page', 'path'],
  );
});

test('only the documented page sizes are ever requested', () => {
  assert.deepEqual(PAGE_SIZES, [25, 50, 100]);

  for (const size of PAGE_SIZES) {
    const params = new URL(
      buildEventsPath(EMPTY_FILTERS, size, 1, null),
      'https://x',
    ).searchParams;

    assert.equal(params.get('limit'), String(size));
  }

  const invalid = new URL(
    buildEventsPath(EMPTY_FILTERS, 999, 1, null),
    'https://x',
  ).searchParams;

  assert.equal(invalid.get('limit'), '25');
});

test('knownTotal is withheld on the first page and reused while paging', () => {
  // No knownTotal on page 1 means recount. Reusing it on later pages keeps a
  // page change to one query instead of forcing another count.
  const first = new URL(
    buildEventsPath(EMPTY_FILTERS, 25, 1, 400),
    'https://x',
  ).searchParams;

  assert.equal(
    first.has('knownTotal'),
    false,
    'page 1 must recount',
  );

  const second = new URL(
    buildEventsPath(EMPTY_FILTERS, 25, 2, 400),
    'https://x',
  ).searchParams;

  assert.equal(second.get('knownTotal'), '400');
  assert.equal(second.get('page'), '2');

  const unknown = new URL(
    buildEventsPath(EMPTY_FILTERS, 25, 2, null),
    'https://x',
  ).searchParams;

  assert.equal(
    unknown.has('knownTotal'),
    false,
    'a total that is not held is not invented',
  );
});

test('a nonsense page never leaves the client', () => {
  for (const page of [0, -3, 'abc', undefined]) {
    const params = new URL(
      buildEventsPath(EMPTY_FILTERS, 25, page, null),
      'https://x',
    ).searchParams;

    assert.equal(params.get('page'), '1');
  }
});

test('applying or resetting filters returns to page one and drops the held total', () => {
  // Reusing a total across a filter change would page against a count from a
  // different query and can produce apparently empty pages.
  const analytics = source('Analytics.jsx');

  const apply = analytics.slice(
    analytics.indexOf('const apply ='),
    analytics.indexOf('const reset ='),
  );

  const reset = analytics.slice(
    analytics.indexOf('const reset ='),
    analytics.indexOf('const changeLimit ='),
  );

  for (const [name, block] of [
    ['apply', apply],
    ['reset', reset],
  ]) {
    assert.match(
      block,
      /setPage\(1\)/,
      `${name} returns to page one`,
    );

    assert.match(
      block,
      /setKnownTotal\(null\)/,
      `${name} drops the held total`,
    );
  }

  assert.match(
    analytics.slice(analytics.indexOf('const changeLimit =')),
    /setPage\(1\)/,
  );
});

test('direct page jumps are clamped to the valid range', () => {
  const analytics = source('Analytics.jsx');

  assert.match(
    analytics,
    /Math\.min\(lastPage, Math\.max\(1, Math\.trunc\(requested\)\)\)/,
  );

  assert.match(
    analytics,
    /setPage\(nextPage\)/,
  );
});

test('changing page size returns to page one', () => {
  const analytics = source('Analytics.jsx');

  const changeLimit = analytics.slice(
    analytics.indexOf('const changeLimit ='),
    analytics.indexOf('const quickSource ='),
  );

  assert.match(changeLimit, /setLimit\(Number\(value\)\)/);
  assert.match(changeLimit, /setPage\(1\)/);
  assert.match(changeLimit, /setPageInput\('1'\)/);
});

test('quick source switching resets pagination and held totals', () => {
  const analytics = source('Analytics.jsx');

  const quickSource = analytics.slice(
    analytics.indexOf('const quickSource ='),
    analytics.indexOf('return (', analytics.indexOf('const quickSource =')),
  );

  assert.match(quickSource, /setDraft\(next\)/);
  assert.match(quickSource, /setApplied\(next\)/);
  assert.match(quickSource, /setPage\(1\)/);
  assert.match(quickSource, /setPageInput\('1'\)/);
  assert.match(quickSource, /setKnownTotal\(null\)/);
});

test('this task does not add Inspect or Export', () => {
  // Both need endpoints that do not exist. A button that cannot work is worse
  // than an absent one, so their absence is asserted explicitly.
  const analytics = source('Analytics.jsx');

  assert.ok(!/Inspect/.test(analytics));
  assert.ok(!/Export/.test(analytics));
});

test('the summary and raw stream remain independent resources', () => {
  const analytics = source('Analytics.jsx');

  assert.match(
    analytics,
    /useBossResource\('\/api\/boss\/analytics\/summary'\)/,
    'summary keeps its own API read',
  );

  assert.match(
    analytics,
    /useBossResource\(path\)/,
    'raw stream keeps its own API read',
  );

  // EventStream is rendered outside the summary status branches. Therefore a
  // summary loading/error state cannot remove the raw stream from the page.
  const summaryConditional = analytics.indexOf(
    "summary.status === 'loading'",
  );
  const streamRender = analytics.lastIndexOf('<EventStream />');

  assert.ok(
    summaryConditional > 0,
    'summary owns its own loading/error handling',
  );

  assert.ok(
    streamRender > summaryConditional,
    'the raw stream renders independently of summary state',
  );

  // Secondary diagnostics remain present without occupying the primary path
  // above the stream.
  assert.match(analytics, /Analytics details/);
  assert.match(analytics, /Coverage/);
  assert.match(analytics, /Countries/);
});