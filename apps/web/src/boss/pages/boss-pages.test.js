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
