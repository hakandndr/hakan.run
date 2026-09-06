// The source dimension, end to end through the read path.
//
// Importing legacy history made `event_source` a real dimension, but the stream
// could neither filter on it nor report it, and the retention delete could not
// see it at all. That last one is the dangerous half: an unscoped cutoff would
// have deleted the entire imported archive the first time the operator honoured
// the native 90-day promise, and the preview would have reported the larger
// number as though that were the intent.

import test from 'node:test';
import assert from 'node:assert/strict';
import { openAnalyticsDb } from './helpers.js';
import {
  buildEventFilter,
  deleteEventsQuery,
  deletePreviewQuery,
  eventCountQuery,
  eventStreamQuery,
  LEGACY_SOURCE,
  NATIVE_SOURCE,
} from '../analytics/queries.js';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 5, 12, 0, 0);

let sequence = 0;

const insert = (db, { at, day, source = NATIVE_SOURCE, path = '/', country = 'US' }) => {
  sequence += 1;
  const id = `e${String(sequence).padStart(6, '0')}`;
  db.prepare(
    `INSERT INTO visitor_events
      (id, occurred_at, date_local, ip_address, country, region, city, colo, path,
       referrer_origin, user_agent, browser_family, device_class, actor_class,
       classification_source, session_id, request_id, event_source)
     VALUES (?, ?, ?, '203.0.113.7', ?, 'California', 'Irvine', 'LAX', ?, 'direct', 'ua',
             'Chrome', 'desktop', 'human-likely', 'none', ?, NULL, ?)`,
  ).run(id, at, day, country, path, `s${sequence}`, source);
  return id;
};

const all = (db, query) => db.prepare(query.sql).all(...query.params);
const one = (db, query) => db.prepare(query.sql).get(...query.params);

// --- Filtering ---------------------------------------------------------------

test('a source filter is an exact bound predicate, never interpolated SQL', () => {
  const { where, params } = buildEventFilter({ source: LEGACY_SOURCE });
  assert.equal(where, 'WHERE event_source = ?');
  assert.deepEqual(params, [LEGACY_SOURCE]);
  assert.ok(!where.includes(LEGACY_SOURCE), 'the value must reach the database as a parameter');
});

test('no source filter means every source, so imported history stays visible', () => {
  const { where, params } = buildEventFilter({});
  assert.equal(where, '');
  assert.deepEqual(params, []);
});

test('the source filter composes with the other filters and the range', () => {
  const { where, params } = buildEventFilter(
    { source: NATIVE_SOURCE, country: 'us', path: '/projects' },
    { start: 10, end: 20 },
  );
  assert.match(where, /event_source = \?/);
  assert.match(where, /country = \?/);
  // Range first, then filters in declaration order: the params must line up
  // with the placeholders or the whole query silently means something else.
  assert.deepEqual(params, [10, 20, 'US', '/projects%', NATIVE_SOURCE]);
});

test('the stream returns only the requested source', () => {
  const db = openAnalyticsDb();
  insert(db, { at: NOW - DAY, day: '2026-09-04' });
  insert(db, { at: NOW - 2 * DAY, day: '2026-09-03' });
  insert(db, { at: NOW - 160 * DAY, day: '2026-03-29', source: LEGACY_SOURCE });

  const legacy = all(db, eventStreamQuery({ source: LEGACY_SOURCE }, 25, 0));
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].event_source, LEGACY_SOURCE);

  const native = all(db, eventStreamQuery({ source: NATIVE_SOURCE }, 25, 0));
  assert.equal(native.length, 2);

  assert.equal(all(db, eventStreamQuery({}, 25, 0)).length, 3, 'unfiltered reads both sources');
});

test('the total agrees with the stream under the same source filter', () => {
  const db = openAnalyticsDb();
  insert(db, { at: NOW, day: '2026-09-05' });
  insert(db, { at: NOW - 160 * DAY, day: '2026-03-29', source: LEGACY_SOURCE });
  insert(db, { at: NOW - 161 * DAY, day: '2026-03-28', source: LEGACY_SOURCE });

  assert.equal(one(db, eventCountQuery({ source: LEGACY_SOURCE })).value, 2);
  assert.equal(one(db, eventCountQuery({ source: NATIVE_SOURCE })).value, 1);
  assert.equal(one(db, eventCountQuery({})).value, 3);
});

// --- The stream carries the dimension ---------------------------------------

test('event_source is returned on every stream row', () => {
  // Without this the UI could filter by a source it could not display, so a
  // mixed page would look like one undifferentiated history.
  const db = openAnalyticsDb();
  insert(db, { at: NOW, day: '2026-09-05' });
  insert(db, { at: NOW - 160 * DAY, day: '2026-03-29', source: LEGACY_SOURCE });

  const rows = all(db, eventStreamQuery({}, 25, 0));
  assert.deepEqual(rows.map((row) => row.event_source), [NATIVE_SOURCE, LEGACY_SOURCE]);
  // Newest first is unchanged by the added column.
  assert.ok(rows[0].occurred_at > rows[1].occurred_at);
});

test('the stream still carries the raw fields it carried before', () => {
  const db = openAnalyticsDb();
  insert(db, { at: NOW, day: '2026-09-05', path: '/projects' });
  const [row] = all(db, eventStreamQuery({}, 25, 0));
  for (const field of [
    'id', 'occurred_at', 'date_local', 'ip_address', 'country', 'region', 'city',
    'path', 'referrer_origin', 'browser_family', 'device_class', 'actor_class',
    'session_id', 'request_id', 'event_source',
  ]) {
    assert.ok(field in row, `${field} must remain in the stream projection`);
  }
});

// --- Retention deletes native history only ----------------------------------

test('the delete preview counts native events only', () => {
  const db = openAnalyticsDb();
  const cutoff = NOW - 90 * DAY;
  insert(db, { at: NOW - 120 * DAY, day: '2026-05-08' });
  insert(db, { at: NOW - 160 * DAY, day: '2026-03-29', source: LEGACY_SOURCE });
  insert(db, { at: NOW - 161 * DAY, day: '2026-03-28', source: LEGACY_SOURCE });

  const preview = one(db, deletePreviewQuery(cutoff));
  assert.equal(preview.value, 1, 'only the one native event older than the cutoff');
  assert.equal(preview.oldest, NOW - 120 * DAY);
});

test('the confirmed deletion never removes imported legacy history', () => {
  const db = openAnalyticsDb();
  const cutoff = NOW - 90 * DAY;
  insert(db, { at: NOW - 120 * DAY, day: '2026-05-08' });
  insert(db, { at: NOW - DAY, day: '2026-09-04' });
  insert(db, { at: NOW - 160 * DAY, day: '2026-03-29', source: LEGACY_SOURCE });

  const query = deleteEventsQuery(cutoff);
  db.prepare(query.sql).run(...query.params);

  const remaining = db
    .prepare('SELECT event_source, COUNT(*) AS n FROM visitor_events GROUP BY event_source ORDER BY event_source')
    .all()
    .map((row) => ({ event_source: row.event_source, n: row.n }));
  assert.deepEqual(remaining, [
    { event_source: LEGACY_SOURCE, n: 1 },
    { event_source: NATIVE_SOURCE, n: 1 },
  ]);
});

test('preview and delete are scoped identically, so the confirmed number is the deleted number', () => {
  const db = openAnalyticsDb();
  const cutoff = NOW - 90 * DAY;
  for (const n of [100, 110, 120]) insert(db, { at: NOW - n * DAY, day: '2026-05-08' });
  for (const n of [150, 160]) insert(db, { at: NOW - n * DAY, day: '2026-03-29', source: LEGACY_SOURCE });

  const previewed = one(db, deletePreviewQuery(cutoff)).value;
  const query = deleteEventsQuery(cutoff);
  const { changes } = db.prepare(query.sql).run(...query.params);
  assert.equal(Number(changes), previewed);
});

test('the retention queries default to native rather than requiring the caller to remember', () => {
  assert.deepEqual(deletePreviewQuery(1).params, [1, NATIVE_SOURCE]);
  assert.deepEqual(deleteEventsQuery(1).params, [1, NATIVE_SOURCE]);
  assert.match(deleteEventsQuery(1).sql, /event_source = \?/);
});

// --- The Boss handlers state the scope --------------------------------------

test('the delete-preview endpoint scopes to native and says so in its payload', async () => {
  const { handleBossApi } = await import('../boss/index.js');
  const seen = [];
  const analyticsDb = {
    prepare: (sql) => ({
      bind: (...params) => {
        seen.push({ sql, params });
        return { all: async () => ({ results: [{ value: 3, oldest: 1, newest: 2 }] }) };
      },
    }),
  };
  const response = await handleBossApi(
    new Request('https://staging.hakan.run/api/boss/analytics/delete-preview?before=2026-06-01'),
    { ANALYTICS_DB: analyticsDb },
    {},
    { email: 'hakan@dndr.net' },
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.source, NATIVE_SOURCE);
  assert.equal(body.affected, 3);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].params.at(-1), NATIVE_SOURCE, 'the preview is bound to the native source');
});

test('the confirmed delete endpoint deletes native history only', async () => {
  const { handleBossApi } = await import('../boss/index.js');
  const statements = [];
  const record = (sql) => ({
    bind: (...params) => {
      statements.push({ sql, params });
      return {
        all: async () => ({ results: [{ value: 4, oldest: 1, newest: 2 }] }),
        run: async () => ({}),
      };
    },
  });
  const env = {
    ANALYTICS_DB: { prepare: record },
    APP_DB: { prepare: record },
  };
  const response = await handleBossApi(
    new Request('https://staging.hakan.run/api/boss/analytics/delete', {
      method: 'POST',
      body: JSON.stringify({ before: '2026-06-01', confirm: 'DELETE 2026-06-01' }),
    }),
    env,
    {},
    { email: 'hakan@dndr.net' },
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.deleted, 4);
  assert.equal(body.source, NATIVE_SOURCE);

  const deletion = statements.find((entry) => entry.sql.startsWith('DELETE FROM visitor_events'));
  assert.ok(deletion, 'a delete statement was issued');
  assert.match(deletion.sql, /event_source = \?/);
  assert.equal(deletion.params.at(-1), NATIVE_SOURCE);
});

test('the events endpoint passes a source filter through to the query', async () => {
  const { handleBossApi } = await import('../boss/index.js');
  const seen = [];
  const analyticsDb = {
    prepare: (sql) => ({
      bind: (...params) => {
        seen.push({ sql, params });
        return { all: async () => ({ results: [] }) };
      },
    }),
  };
  const response = await handleBossApi(
    new Request('https://staging.hakan.run/api/boss/analytics/events?source=legacy_panel&limit=50&page=1'),
    { ANALYTICS_DB: analyticsDb },
    {},
    { email: 'hakan@dndr.net' },
  );
  assert.equal(response.status, 200);
  const stream = seen.find((entry) => entry.sql.includes('FROM visitor_events') && entry.sql.includes('LIMIT'));
  assert.ok(stream, 'the stream query ran');
  assert.match(stream.sql, /event_source = \?/, 'the filter reached the SQL');
  const projection = stream.sql.slice(0, stream.sql.indexOf('FROM visitor_events'));
  assert.match(projection, /event_source/, 'the stream projects the source it can now filter on');
  assert.deepEqual(stream.params, [LEGACY_SOURCE, 50, 0]);
});
