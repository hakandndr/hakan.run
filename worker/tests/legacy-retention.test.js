// Retention, and the legacy history that must not disturb it.
//
// The 90-day commitment is about what this system collects. Importing 163-day-old
// history from the legacy panel would otherwise make Boss System report that
// promise as breached on the day of the import — a false alarm about a promise
// that was never made about imported history.

import test from 'node:test';
import assert from 'node:assert/strict';
import { openAnalyticsDb } from './helpers.js';
import {
  oldestEventQuery,
  totalEventsQuery,
  eventsBySourceQuery,
  NATIVE_SOURCE,
  LEGACY_SOURCE,
} from '../analytics/queries.js';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 5, 12, 0, 0);

const insert = (db, { id, at, day, source }) => {
  const columns = source
    ? `(id, occurred_at, date_local, ip_address, country, region, city, colo, path,
        referrer_origin, user_agent, browser_family, device_class, actor_class,
        classification_source, session_id, request_id, event_source)`
    : `(id, occurred_at, date_local, ip_address, country, region, city, colo, path,
        referrer_origin, user_agent, browser_family, device_class, actor_class,
        classification_source, session_id, request_id)`;
  const values = source ? '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?' : '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?';
  const params = [id, at, day, '198.51.100.1', 'US', 'CA', 'Irvine', 'LAX', '/',
    'Direct', 'ua', 'Chrome', 'desktop', 'human-likely', 'none', 's1', null];
  if (source) params.push(source);
  db.prepare(`INSERT INTO visitor_events ${columns} VALUES (${values})`).run(...params);
};

const one = (db, query) => db.prepare(query.sql).get(...query.params);

test('an insert that names no source is native, so ingestion needs no change', () => {
  const db = openAnalyticsDb();
  insert(db, { id: 'n1', at: NOW - DAY, day: '2026-09-04' });
  assert.equal(db.prepare('SELECT event_source FROM visitor_events WHERE id = ?').get('n1').event_source, NATIVE_SOURCE);
});

test('163-day-old legacy history does not age the native retention figure', () => {
  const db = openAnalyticsDb();
  insert(db, { id: 'n1', at: NOW - 2 * DAY, day: '2026-09-03' });
  insert(db, { id: 'l1', at: NOW - 163 * DAY, day: '2026-03-26', source: LEGACY_SOURCE });

  // Native retention sees only native events. Without the source scope the
  // oldest native event would appear to be five months old and the policy would
  // report itself breached.
  assert.equal(one(db, oldestEventQuery(NATIVE_SOURCE)).oldest_day, '2026-09-03');
  assert.equal(one(db, oldestEventQuery(LEGACY_SOURCE)).oldest_day, '2026-03-26');
});

test('the native retained-event count excludes imported history', () => {
  const db = openAnalyticsDb();
  insert(db, { id: 'n1', at: NOW - DAY, day: '2026-09-04' });
  for (const n of [1, 2, 3]) {
    insert(db, { id: `l${n}`, at: NOW - 100 * DAY, day: '2026-05-28', source: LEGACY_SOURCE });
  }
  assert.equal(one(db, totalEventsQuery(NATIVE_SOURCE)).value, 1);
  assert.equal(one(db, totalEventsQuery(LEGACY_SOURCE)).value, 3);
});

test('with only legacy history, native retention has nothing to report and no overdue state', () => {
  // The state right after an import into a fresh environment. `oldest` is
  // undefined rather than 163 days ago, so the age is zero and the flag is off —
  // which is the truth: this system has collected nothing yet.
  const db = openAnalyticsDb();
  insert(db, { id: 'l1', at: NOW - 163 * DAY, day: '2026-03-26', source: LEGACY_SOURCE });
  assert.equal(one(db, oldestEventQuery(NATIVE_SOURCE)), undefined);
  assert.equal(one(db, totalEventsQuery(NATIVE_SOURCE)).value, 0);
});

test('legacy history is separately reportable, so it is not hidden either', () => {
  const db = openAnalyticsDb();
  insert(db, { id: 'n1', at: NOW - DAY, day: '2026-09-04' });
  insert(db, { id: 'l1', at: NOW - 163 * DAY, day: '2026-03-26', source: LEGACY_SOURCE });

  const rows = db.prepare(eventsBySourceQuery().sql).all();
  assert.deepEqual(
    rows.map((row) => ({ source: row.source, value: row.value })),
    [{ source: 'legacy_panel', value: 1 }, { source: 'native', value: 1 }],
  );
  // The oldest instant per source comes from the same aggregate as the count,
  // so a caller cannot pair a count with an instant from a different row.
  assert.equal(rows.find((r) => r.source === LEGACY_SOURCE).oldest, NOW - 163 * DAY);
});

test('every source with rows is reported, so a future third source cannot hide', () => {
  const db = openAnalyticsDb();
  insert(db, { id: 'n1', at: NOW, day: '2026-09-05' });
  insert(db, { id: 'x1', at: NOW, day: '2026-09-05', source: 'some_future_source' });
  assert.deepEqual(
    db.prepare(eventsBySourceQuery().sql).all().map((r) => r.source),
    ['native', 'some_future_source'],
  );
});

test('imported events remain readable through the ordinary V3 read path', () => {
  const db = openAnalyticsDb();
  insert(db, { id: 'l1', at: NOW - 100 * DAY, day: '2026-05-28', source: LEGACY_SOURCE });
  // No source filter: the analytics module reads history and native events alike.
  const rows = db.prepare('SELECT path, country, actor_class FROM visitor_events WHERE date_local = ?').all('2026-05-28');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].path, '/');
});

test('the import path never writes coverage or aggregates', () => {
  const db = openAnalyticsDb();
  insert(db, { id: 'l1', at: NOW - 100 * DAY, day: '2026-05-28', source: LEGACY_SOURCE });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM analytics_coverage').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM analytics_daily').get().n, 0);
});

// --- The Dashboard regression ------------------------------------------------

test('the Dashboard binds the source parameter it now has to bind', async () => {
  // The live failure: `oldestEventQuery` gained a bound `event_source = ?`, and
  // the Dashboard still prepared its SQL without binding. D1 refuses a statement
  // with an unfilled placeholder, so a wrong number would have been the lucky
  // outcome — it was a 500 instead. This asserts the call site passes params.
  const { handleBossApi } = await import('../boss/index.js');
  const seen = [];
  const analyticsDb = {
    prepare: (sql) => ({
      bind: (...params) => {
        seen.push({ sql, params });
        return { all: async () => ({ results: [{ oldest: 1, oldest_day: '2026-09-04' }] }) };
      },
      // No bind() call means an unbound placeholder reached the database.
      first: async () => { throw new Error('prepared without binding'); },
      all: async () => { throw new Error('prepared without binding'); },
    }),
  };
  const appDb = { prepare: () => ({ first: async () => ({ value: 2 }) }) };

  const response = await handleBossApi(
    new Request('https://staging.hakan.run/api/boss/dashboard'),
    { ENVIRONMENT: 'staging', APP_DB: appDb, ANALYTICS_DB: analyticsDb },
    {},
    { email: 'hakan@dndr.net' },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.pendingSubmissions, 2);
  assert.equal(body.oldestAnalyticsEvent, 1);
  assert.deepEqual(seen.map((entry) => entry.params), [[NATIVE_SOURCE]]);
});

test('every analytics statement the Boss API prepares is bound', async () => {
  // Generalised so the next source-scoped query cannot repeat this.
  const { handleBossApi } = await import('../boss/index.js');
  const unbound = [];
  const analyticsDb = {
    prepare: (sql) => ({
      bind: () => ({ all: async () => ({ results: [] }), first: async () => null }),
      first: async () => { unbound.push(sql); return null; },
      all: async () => { unbound.push(sql); return { results: [] }; },
    }),
  };
  const appDb = { prepare: () => ({ first: async () => ({ value: 0 }) }) };
  const env = { ENVIRONMENT: 'staging', APP_DB: appDb, ANALYTICS_DB: analyticsDb };

  for (const path of ['/api/boss/dashboard', '/api/boss/system']) {
    await handleBossApi(new Request(`https://staging.hakan.run${path}`), env, {}, { email: 'hakan@dndr.net' });
  }
  assert.deepEqual(unbound, [], 'an analytics statement was prepared without bind()');
});
