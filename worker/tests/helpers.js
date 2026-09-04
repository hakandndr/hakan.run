// Test harness: the real migrations applied to an in-memory SQLite database,
// driven through the same query builders the Worker uses. D1 is SQLite, so a
// plan proven here is the plan production emits.

import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const openAnalyticsDb = () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(path.join(root, 'migrations/analytics/0001_init.sql'), 'utf8'));
  return db;
};

export const openAppDb = () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(path.join(root, 'migrations/app/0001_init.sql'), 'utf8'));
  return db;
};

/** A `run` implementation matching the Worker's D1 usage. */
export const runner = (db) => async ({ sql, params }) => db.prepare(sql).all(...params);

export const explain = (db, { sql, params }) =>
  db
    .prepare(`EXPLAIN QUERY PLAN ${sql}`)
    .all(...params)
    .map((row) => row.detail)
    .join('\n');

let sequence = 0;

/** Insert one PAGE event. `at` is an instant; `day` is its local day key. */
export const insertEvent = (db, { at, day, path = '/', country = 'US', actor = 'human-likely', ip = '203.0.113.1', browser = 'Chrome', city = 'Irvine', referrer = 'direct' }) => {
  sequence += 1;
  db.prepare(
    `INSERT INTO visitor_events
      (id, occurred_at, date_local, ip_address, country, region, city, colo, path,
       referrer_origin, user_agent, browser_family, device_class, actor_class,
       classification_source, session_id, request_id)
     VALUES (?, ?, ?, ?, ?, 'California', ?, 'LAX', ?, ?, 'ua', ?, 'desktop', ?, 'none', ?, NULL)`,
  ).run(
    `e${String(sequence).padStart(6, '0')}`,
    at,
    day,
    ip,
    country,
    city,
    path,
    referrer,
    browser,
    actor,
    `s${sequence}`,
  );
};

/** Aggregate a day and mark it covered, exactly as the scheduled job would. */
export const aggregateDay = async (db, day, coveredAt = 1) => {
  const { aggregationStatements } = await import('../analytics/aggregate.js');
  for (const statement of aggregationStatements(day, coveredAt)) {
    db.prepare(statement.sql).run(...statement.params);
  }
};

/** Mark a day covered without aggregating it — an inconsistent ledger. */
export const markCoveredOnly = (db, day, version = 1) =>
  db
    .prepare(
      `INSERT INTO analytics_coverage (date_local, aggregate_version, event_count, covered_at)
       VALUES (?, ?, 0, 1)`,
    )
    .run(day, version);
