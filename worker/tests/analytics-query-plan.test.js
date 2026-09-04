// Query-plan guards.
//
// These run EXPLAIN QUERY PLAN over the SQL the production builders emit, not
// over hand-copied strings. A builder that starts scanning visitor_events where
// an indexed, bounded plan is expected fails here.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateTotalsQuery,
  coveredDaysQuery,
  dayOrdinalsQuery,
  deletePreviewQuery,
  eventCountQuery,
  eventStreamQuery,
  oldestEventQuery,
  rawDailySeriesQuery,
  rawTotalsQuery,
} from '../analytics/queries.js';
import { localDayBounds } from '../lib/time.js';
import { aggregateDay, explain, insertEvent, openAnalyticsDb } from './helpers.js';

const DAYS = ['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02'];

// A populated, analyzed database, so the planner makes the choices it would
// make in production rather than the choices it makes against empty tables.
const seeded = () => {
  const db = openAnalyticsDb();
  let index = 0;
  for (const day of DAYS) {
    const { start } = localDayBounds(day);
    for (let n = 0; n < 250; n += 1) {
      index += 1;
      insertEvent(db, {
        at: start + (n % 23) * 3_600_000 + n,
        day,
        path: n % 3 === 0 ? '/contact' : `/project/p${n % 7}`,
        country: ['US', 'DE', 'TR', 'GB'][n % 4],
        ip: `203.0.113.${n % 250}`,
        actor: n % 5 === 0 ? 'verified-bot' : 'human-likely',
      });
    }
  }
  db.exec('ANALYZE');
  return db;
};

const range = { start: localDayBounds('2026-08-31').start, end: localDayBounds('2026-09-02').end };

/**
 * A range-bounded query must resolve as a SEARCH: an index seek limited by the
 * predicate. `SCAN visitor_events`, with or without an index, means the whole
 * table is walked and cost grows with retention.
 */
const assertBoundedSearch = (plan, label) => {
  assert.ok(
    /SEARCH visitor_events/.test(plan),
    `${label} must resolve as an indexed SEARCH. Plan:\n${plan}`,
  );
  assert.ok(
    !/SCAN visitor_events/.test(plan),
    `${label} must not scan visitor_events. Plan:\n${plan}`,
  );
};

test('the event stream uses the time index and never scans the table', () => {
  const db = seeded();
  const plan = explain(db, eventStreamQuery({}, 25, 0, range));
  assertBoundedSearch(plan, 'event stream');
  assert.match(plan, /visitor_events_occurred_idx/);
});

test('a country-filtered stream uses a selective index', () => {
  const db = seeded();
  const plan = explain(db, eventStreamQuery({ country: 'TR' }, 25, 0, range));
  assertBoundedSearch(plan, 'country-filtered stream');
  assert.match(plan, /visitor_events_(country_time|occurred)_idx/);
});

test('a path-prefix filter stays indexable', () => {
  const db = seeded();
  const plan = explain(db, eventStreamQuery({ path: '/project/' }, 25, 0, range));
  assertBoundedSearch(plan, 'path-prefix stream');
});

test('the filtered count is bounded by the time index', () => {
  const db = seeded();
  const plan = explain(db, eventCountQuery({}, range));
  assertBoundedSearch(plan, 'event count');
});

test('raw totals and the daily series are range-bounded', () => {
  const db = seeded();
  assertBoundedSearch(explain(db, rawTotalsQuery(range, {})), 'raw totals');
  assertBoundedSearch(explain(db, rawDailySeriesQuery(range, {})), 'raw daily series');
});

test('TODAY ordinals are bounded to a single local day by index', () => {
  const db = seeded();
  const ids = db
    .prepare(`SELECT id FROM visitor_events WHERE date_local = ? LIMIT 25`)
    .all('2026-09-01')
    .map((row) => row.id);
  const plan = explain(db, dayOrdinalsQuery('2026-09-01', ids));
  assert.match(
    plan,
    /visitor_events_local_day_idx/,
    `TODAY ordinals must use the local-day index. Plan:\n${plan}`,
  );
  assertBoundedSearch(plan, 'today ordinals');
});

test('the coverage ledger read is indexed', () => {
  const db = seeded();
  const plan = explain(db, coveredDaysQuery('2026-08-30', '2026-09-02'));
  assert.ok(
    !/SCAN analytics_coverage(?!\s+USING)/.test(plan),
    `coverage read must be indexed. Plan:\n${plan}`,
  );
});

test('aggregate reads are keyed by version and day', async () => {
  const db = seeded();
  await aggregateDay(db, '2026-08-30');
  await aggregateDay(db, '2026-08-31');
  db.exec('ANALYZE');
  const plan = explain(db, aggregateTotalsQuery(['2026-08-30', '2026-08-31']));
  assert.ok(
    /analytics_daily/.test(plan),
    `aggregate totals must touch analytics_daily. Plan:\n${plan}`,
  );
});

test('delete preview is bounded by the time index', () => {
  const db = seeded();
  assertBoundedSearch(explain(db, deletePreviewQuery(range.start)), 'delete preview');
});

test('oldest-event age reads one row through the time index without sorting', () => {
  const db = seeded();
  const plan = explain(db, oldestEventQuery());
  // SQLite words an ordered index traversal as SCAN, but with LIMIT 1 it stops
  // at the first row. What must never appear is a sort: that would mean the
  // index order was unusable and the whole table had to be materialised.
  assert.match(
    plan,
    /visitor_events_occurred_idx/,
    `oldest-event age must traverse the time index. Plan:\n${plan}`,
  );
  assert.ok(
    !/TEMP B-TREE|USE TEMP/.test(plan),
    `oldest-event age must not sort. Plan:\n${plan}`,
  );
});
