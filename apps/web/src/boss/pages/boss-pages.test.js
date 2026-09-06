// Contract regressions the live staging smoke found.
//
// Both are the same class of bug: the page and the API disagreed about a field
// name, and nothing failed loudly — one panel rendered em dashes, the other
// rendered nothing at all. A unit test that reads the source is enough to pin
// the field names, and is what these did not have.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMPTY_FILTERS, PAGE_SIZES, STREAM_FILTER_KEYS, buildEventsPath } from './eventStreamPath.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = (file) => readFileSync(path.join(here, file), 'utf8');

// --- Analytics: topPages / countries rows are {label, value} -----------------

test('the analytics tables read the field the API actually sends', () => {
  // `mergeLabelledCounts` emits {label, value}; the tables asked for `count`,
  // so DataTable fell through to its em-dash placeholder for every row while
  // the totals above them were correct — which is why this looked like a data
  // problem rather than a naming one.
  const analytics = source('Analytics.jsx');
  assert.ok(!/key: 'count'/.test(analytics), "no table may key on 'count'");
  assert.equal((analytics.match(/key: 'value', label: 'Events'/g) ?? []).length, 2,
    'both Top pages and Countries read `value`');
});

test('the analytics tables still label their own dimension', () => {
  const analytics = source('Analytics.jsx');
  assert.match(analytics, /key: 'label', label: 'Path'/);
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
  // Native retention keeps its own panel and its own overdue alert; the legacy
  // figures must not be folded into it, or the distinction the backend draws
  // would be lost in the rendering.
  const system = source('System.jsx');
  const nativePanel = system.indexOf('analytics.retentionOverdue');
  const legacyPanel = system.indexOf('Legacy analytics history');
  assert.ok(nativePanel > 0 && legacyPanel > 0);
  assert.ok(nativePanel < legacyPanel, 'native retention is reported first, in its own panel');
  assert.match(system, /Not governed by the native retention policy/);
});

test('System tolerates a payload without the new fields', () => {
  // A Worker deployed before this change returns neither field. The page must
  // render rather than throw, because a stale Worker is a deployment ordering
  // problem, not a reason for the private surface to break.
  const system = source('System.jsx');
  assert.match(system, /data\.legacyAnalytics \?\? null/);
  assert.match(system, /data\.eventSources \?\? \[\]/);
});

// --- Analytics: the raw page-visit stream ------------------------------------
//
// The stream is a contract with /api/boss/analytics/events, and the two live
// regressions above were both contract drift that no test could see. These pin
// the field names the API sends, the parameters it expects, and the paging rule
// that makes a page change cost one query instead of two.

test('the stream renders the columns the raw event API returns', () => {
  const analytics = source('Analytics.jsx');
  for (const [key, label] of [
    ['rowNumber', '#'],
    ['todayNumber', 'Today #'],
    ['ip_address', 'IP Address'],
    ['event_source', 'Source'],
    ['actor_class', 'Actor'],
    ['occurred_at', 'Date (PT)'],
    ['country', 'Country'],
    ['path', 'Page'],
    ['referrer_origin', 'Referrer'],
  ]) {
    assert.ok(
      analytics.includes(`key: '${key}', label: '${label}'`),
      `the stream must render ${label} from ${key}`,
    );
  }
  // Two columns pair a key with a second field, so they are asserted on both
  // the label and the fields they render rather than on the key alone.
  for (const [label, fields] of [
    ['City / Region', ['row.city', 'row.region']],
    ['Device / Browser', ['row.device_class', 'row.browser_family']],
  ]) {
    assert.ok(analytics.includes(`label: '${label}'`), `${label} must be a column`);
    for (const field of fields) assert.ok(analytics.includes(field), `${label} must render ${field}`);
  }
});

test('the stream offers a control for every filter the endpoint accepts', () => {
  // Filter names ARE the query parameter names. A renamed control does not
  // fail — the Worker ignores a parameter it does not know — so the page and
  // the path builder are pinned to the same list.
  const analytics = source('Analytics.jsx');
  for (const key of STREAM_FILTER_KEYS) {
    assert.match(analytics, new RegExp(`draft\\.${key}\\b`), `${key} must have a control`);
    assert.match(analytics, new RegExp(`set\\('${key}'\\)`), `${key} must be editable`);
  }
});

test('the source filter offers all, native and legacy_panel', () => {
  const analytics = source('Analytics.jsx');
  assert.match(analytics, /\{ value: '', label: 'All' \}/);
  assert.match(analytics, /value: 'native'/);
  assert.match(analytics, /value: 'legacy_panel'/);
});

test('the stream shows a total and a per-page control', () => {
  const analytics = source('Analytics.jsx');
  assert.match(analytics, /total records/);
  assert.match(analytics, /PAGE_SIZES\.map/, 'the page sizes are offered, not hard-coded in markup');
});

// --- The request contract, executed rather than read ------------------------

test('the path carries every non-empty filter under its own name', () => {
  const path = buildEventsPath(
    { ...EMPTY_FILTERS, ip: '203.0.113.7', source: 'legacy_panel', country: 'US', from: '2026-01-01' },
    50,
    1,
    null,
  );
  const params = new URL(path, 'https://staging.hakan.run').searchParams;
  assert.equal(params.get('ip'), '203.0.113.7');
  assert.equal(params.get('source'), 'legacy_panel');
  assert.equal(params.get('country'), 'US');
  assert.equal(params.get('from'), '2026-01-01');
  assert.equal(params.get('limit'), '50');
  assert.equal(params.get('page'), '1');
});

test('blank and whitespace-only filters are omitted, not sent empty', () => {
  const path = buildEventsPath({ ...EMPTY_FILTERS, city: '   ', path: ' /projects ' }, 25, 1, null);
  const params = new URL(path, 'https://staging.hakan.run').searchParams;
  assert.equal(params.has('city'), false);
  assert.equal(params.get('path'), '/projects');
  // Every untouched filter stays out of the query entirely.
  assert.deepEqual([...params.keys()].sort(), ['limit', 'page', 'path']);
});

test('only the documented page sizes are ever requested', () => {
  assert.deepEqual(PAGE_SIZES, [25, 50, 100]);
  for (const size of PAGE_SIZES) {
    assert.equal(new URL(buildEventsPath(EMPTY_FILTERS, size, 1, null), 'https://x').searchParams.get('limit'),
      String(size));
  }
  assert.equal(new URL(buildEventsPath(EMPTY_FILTERS, 999, 1, null), 'https://x').searchParams.get('limit'), '25');
});

test('knownTotal is withheld on the first page and reused while paging', () => {
  // The rule the API documents: no knownTotal means recount, which is what a
  // changed filter set needs. Sending it back is what makes a page change one
  // query instead of two, so both halves are asserted.
  const first = new URL(buildEventsPath(EMPTY_FILTERS, 25, 1, 400), 'https://x').searchParams;
  assert.equal(first.has('knownTotal'), false, 'page 1 must recount');

  const second = new URL(buildEventsPath(EMPTY_FILTERS, 25, 2, 400), 'https://x').searchParams;
  assert.equal(second.get('knownTotal'), '400');
  assert.equal(second.get('page'), '2');

  const unknown = new URL(buildEventsPath(EMPTY_FILTERS, 25, 2, null), 'https://x').searchParams;
  assert.equal(unknown.has('knownTotal'), false, 'a total that is not held is not invented');
});

test('a nonsense page never leaves the client', () => {
  for (const page of [0, -3, 'abc', undefined]) {
    assert.equal(new URL(buildEventsPath(EMPTY_FILTERS, 25, page, null), 'https://x').searchParams.get('page'), '1');
  }
});

test('applying or resetting filters returns to page one and drops the held total', () => {
  // Reusing a total across a filter change would page against a count that
  // describes a different query, which is how a stream ends up with pages that
  // are empty for no visible reason.
  const analytics = source('Analytics.jsx');
  const apply = analytics.slice(analytics.indexOf('const apply ='), analytics.indexOf('const reset ='));
  const reset = analytics.slice(analytics.indexOf('const reset ='), analytics.indexOf('const changeLimit ='));
  for (const [name, block] of [['apply', apply], ['reset', reset]]) {
    assert.match(block, /setPage\(1\)/, `${name} returns to page one`);
    assert.match(block, /setKnownTotal\(null\)/, `${name} drops the held total`);
  }
  assert.match(analytics.slice(analytics.indexOf('const changeLimit =')), /setPage\(1\)/);
});

test('this task does not add Inspect or Export', () => {
  // Both need endpoints that do not exist. A button that cannot work is worse
  // than an absent one, so their absence is asserted rather than assumed.
  const analytics = source('Analytics.jsx');
  assert.ok(!/Inspect/.test(analytics));
  assert.ok(!/Export/.test(analytics));
});

test('the summary panels survive a failing stream and vice versa', () => {
  const analytics = source('Analytics.jsx');
  const summary = analytics.indexOf('const Summary =');
  const stream = analytics.indexOf('const EventStream =');
  assert.ok(summary > 0 && stream > 0, 'each half owns its own resource read');
  assert.match(analytics, /useBossResource\('\/api\/boss\/analytics\/summary'\)/);
  assert.match(analytics, /useBossResource\(path\)/);
  for (const section of ['Totals', 'Coverage', 'Top pages', 'Countries']) {
    assert.ok(analytics.includes(`title="${section}"`), `${section} must be preserved`);
  }
});
