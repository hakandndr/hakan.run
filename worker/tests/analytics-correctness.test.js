// Correctness of the raw + aggregate merge.
//
// Each case here is a failure class the reference implementation actually hit:
// a partial day at either edge, a hole in the middle, a covered zero mistaken
// for an uncovered day, ranking truncated before the merge, and aggregate rows
// without a ledger row being trusted anyway.

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSummary } from '../analytics/summary.js';
import { localDayBounds } from '../lib/time.js';
import {
  aggregateDay,
  insertEvent,
  markCoveredOnly,
  openAnalyticsDb,
  runner,
} from './helpers.js';

const at = (day, hour) => localDayBounds(day).start + hour * 3_600_000;

const seed = (db, day, count, overrides = {}) => {
  for (let index = 0; index < count; index += 1) {
    insertEvent(db, { at: at(day, index % 20), day, ...overrides });
  }
};

const summarize = (db, from, to, today, options = {}) =>
  buildSummary(runner(db), { from, to, today, ...options });

test('a leading day aggregated before the range still counts exactly once', async () => {
  const db = openAnalyticsDb();
  seed(db, '2026-09-01', 5);
  seed(db, '2026-09-02', 3);
  await aggregateDay(db, '2026-09-01');

  const summary = await summarize(db, '2026-09-01', '2026-09-02', '2026-09-03');
  assert.equal(summary.totals.events, 8);
  assert.deepEqual(summary.coverage.aggregateDays, ['2026-09-01']);
  assert.deepEqual(summary.coverage.rawDays, ['2026-09-02']);
});

test('the current day is always read raw and is never taken from aggregates', async () => {
  const db = openAnalyticsDb();
  seed(db, '2026-09-01', 4);
  seed(db, '2026-09-02', 6);
  // Even if the current day were somehow aggregated, it must not be trusted.
  await aggregateDay(db, '2026-09-01');
  await aggregateDay(db, '2026-09-02');

  const summary = await summarize(db, '2026-09-01', '2026-09-02', '2026-09-02');
  assert.equal(summary.totals.events, 10);
  assert.deepEqual(summary.coverage.aggregateDays, ['2026-09-01']);
  assert.deepEqual(summary.coverage.rawDays, ['2026-09-02']);
  assert.equal(summary.totals.today, 6);
});

test('a missing middle day falls back to raw without gaps or double counting', async () => {
  const db = openAnalyticsDb();
  seed(db, '2026-09-01', 2);
  seed(db, '2026-09-02', 7);
  seed(db, '2026-09-03', 3);
  await aggregateDay(db, '2026-09-01');
  await aggregateDay(db, '2026-09-03');

  const summary = await summarize(db, '2026-09-01', '2026-09-03', '2026-09-04');
  assert.equal(summary.totals.events, 12);
  assert.deepEqual(summary.coverage.rawDays, ['2026-09-02']);
  assert.deepEqual(
    summary.trend.map((point) => point.value),
    [2, 7, 3],
  );
});

test('a covered day with zero events differs from an uncovered day', async () => {
  const db = openAnalyticsDb();
  seed(db, '2026-09-01', 4);
  await aggregateDay(db, '2026-09-01');
  await aggregateDay(db, '2026-09-02'); // real, empty, and covered

  const summary = await summarize(db, '2026-09-01', '2026-09-02', '2026-09-03');
  assert.deepEqual(summary.coverage.aggregateDays, ['2026-09-01', '2026-09-02']);
  assert.deepEqual(summary.coverage.rawDays, []);
  assert.equal(summary.totals.events, 4);
  assert.deepEqual(summary.trend, [
    { label: '2026-09-01', value: 4 },
    { label: '2026-09-02', value: 0 },
  ]);
});

test('aggregate rows without a ledger row are never trusted', async () => {
  const db = openAnalyticsDb();
  seed(db, '2026-09-01', 5);
  // Aggregate rows exist, but the ledger does not authorise them.
  db.prepare(
    `INSERT INTO analytics_daily
       (date_local, aggregate_version, path, country, device_class, browser_family, actor_class, event_count)
     VALUES ('2026-09-01', 1, '/', 'US', 'desktop', 'Chrome', 'human-likely', 999)`,
  ).run();

  const summary = await summarize(db, '2026-09-01', '2026-09-01', '2026-09-02');
  assert.deepEqual(summary.coverage.aggregateDays, []);
  assert.equal(summary.totals.events, 5, 'raw fallback must ignore the unledgered 999');
});

test('a ledger row at another aggregate_version does not authorise a read', async () => {
  const db = openAnalyticsDb();
  seed(db, '2026-09-01', 5);
  markCoveredOnly(db, '2026-09-01', 2);

  const summary = await summarize(db, '2026-09-01', '2026-09-01', '2026-09-02');
  assert.deepEqual(summary.coverage.aggregateDays, []);
  assert.equal(summary.totals.events, 5);
});

test('top pages truncate only after the sources are merged', async () => {
  const db = openAnalyticsDb();
  // /contact never leads either source alone, but leads once they are summed.
  for (let index = 0; index < 12; index += 1) {
    seed(db, '2026-09-01', 3, { path: `/project/p${index}` });
  }
  seed(db, '2026-09-01', 6, { path: '/contact' });
  await aggregateDay(db, '2026-09-01');

  for (let index = 0; index < 12; index += 1) {
    seed(db, '2026-09-02', 3, { path: `/project/p${index}` });
  }
  seed(db, '2026-09-02', 6, { path: '/contact' });

  const summary = await summarize(db, '2026-09-01', '2026-09-02', '2026-09-03');
  assert.equal(summary.topPages[0].label, '/contact');
  assert.equal(summary.topPages[0].value, 12);
  assert.equal(summary.topPages.length, 10);
});

test('a country split across raw and aggregate ranks on its combined total', async () => {
  const db = openAnalyticsDb();
  const codes = ['AA','BB','CC','DD','EE','FF','GG','HH','II','JJ','KK'];
  for (const code of codes) seed(db, '2026-09-01', 4, { country: code });
  seed(db, '2026-09-01', 3, { country: 'ZZ' });
  await aggregateDay(db, '2026-09-01');
  seed(db, '2026-09-02', 3, { country: 'ZZ' });

  const summary = await summarize(db, '2026-09-01', '2026-09-02', '2026-09-03');
  const labels = summary.countries.map((row) => row.label);
  assert.ok(labels.includes('ZZ'), 'ZZ is 3 + 3 = 6 and must outrank the 4s');
  assert.equal(summary.countries.find((row) => row.label === 'ZZ').value, 6);
  assert.equal(summary.countries.length, 10);
});

test('a filter aggregates cannot express suppresses aggregate reads entirely', async () => {
  const db = openAnalyticsDb();
  seed(db, '2026-09-01', 5, { ip: '198.51.100.7' });
  seed(db, '2026-09-01', 4, { ip: '203.0.113.9' });
  await aggregateDay(db, '2026-09-01');

  const summary = await summarize(db, '2026-09-01', '2026-09-01', '2026-09-02', {
    filters: { ip: '198.51.100.7', ipExact: true },
  });
  assert.equal(summary.coverage.aggregateSuppressedByFilter, true);
  assert.equal(summary.totals.events, 5);
});

test('actor split stays consistent across merged sources', async () => {
  const db = openAnalyticsDb();
  seed(db, '2026-09-01', 4, { actor: 'human-likely' });
  seed(db, '2026-09-01', 2, { actor: 'verified-bot' });
  await aggregateDay(db, '2026-09-01');
  seed(db, '2026-09-02', 3, { actor: 'automated-likely' });
  seed(db, '2026-09-02', 1, { actor: 'unknown' });

  const summary = await summarize(db, '2026-09-01', '2026-09-02', '2026-09-03');
  assert.equal(summary.totals.events, 10);
  assert.equal(summary.totals.human, 5);
  assert.equal(summary.totals.automated, 5);
  assert.equal(summary.totals.human + summary.totals.automated, summary.totals.events);
});
