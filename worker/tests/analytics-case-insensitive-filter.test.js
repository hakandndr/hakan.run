// Boss free-text analytics filters are case-insensitive at the SQL boundary.

import test from 'node:test';
import assert from 'node:assert/strict';
import { openAnalyticsDb } from './helpers.js';
import {
  buildEventFilter,
  eventCountQuery,
  eventStreamQuery,
  LEGACY_SOURCE,
  NATIVE_SOURCE,
} from '../analytics/queries.js';

const BASE = Date.UTC(2026, 8, 12, 12, 0, 0);

const insert = (db, {
  id,
  at = BASE,
  country = 'US',
  city = 'Istanbul',
  region = 'Istanbul',
  path = '/card',
  referrer = 'Direct',
  browser = 'Chrome',
  ip = '203.0.113.7',
  source = NATIVE_SOURCE,
}) => db.prepare(
  `INSERT INTO visitor_events
    (id, occurred_at, date_local, ip_address, country, region, city, colo, path,
     referrer_origin, user_agent, browser_family, device_class, actor_class,
     classification_source, session_id, request_id, event_source)
   VALUES (?, ?, '2026-09-12', ?, ?, ?, ?, 'LAX', ?, ?, 'ua', ?, 'desktop',
           'human-likely', 'none', ?, NULL, ?)`,
).run(id, at, ip, country, region, city, path, referrer, browser, `session-${id}`, source);

const ids = (db, filters, limit = 100, offset = 0, range = null) => db
  .prepare(eventStreamQuery(filters, limit, offset, range).sql)
  .all(...eventStreamQuery(filters, limit, offset, range).params)
  .map((row) => row.id);

const count = (db, filters, range = null) => {
  const query = eventCountQuery(filters, range);
  return Number(db.prepare(query.sql).get(...query.params).value);
};

const seeded = () => {
  const db = openAnalyticsDb();
  insert(db, { id: 'tr', country: 'TR', at: BASE + 1 });
  insert(db, { id: 'us', country: 'US', at: BASE + 2 });
  insert(db, { id: 'it', country: 'IT', at: BASE + 3 });
  insert(db, {
    id: 'legacy',
    at: BASE + 4,
    country: 'Türkiye',
    city: 'Izmir',
    region: 'Izmir',
    path: '/contact',
    referrer: 'Instagram',
    browser: 'Safari',
    ip: '198.51.100.9',
    source: LEGACY_SOURCE,
  });
  return db;
};

test('country codes match identically in upper, lower and mixed case', () => {
  const db = seeded();

  for (const [expected, variants] of [
    ['tr', ['TR', 'tr', 'Tr', 'tR']],
    ['us', ['US', 'us', 'Us', 'uS']],
    ['it', ['IT', 'it', 'It', 'iT']],
  ]) {
    const results = variants.map((country) => ids(db, { country }));
    for (const result of results) assert.deepEqual(result, [expected]);
    assert.ok(results.every((result) => JSON.stringify(result) === JSON.stringify(results[0])));
  }
});

test('city, path, referrer and browser filters preserve match mode without case sensitivity', () => {
  const db = seeded();

  assert.deepEqual(ids(db, { city: 'istan' }), ids(db, { city: 'ISTAN' }));
  assert.deepEqual(ids(db, { city: 'ISTAN' }), ['it', 'us', 'tr']);
  assert.deepEqual(ids(db, { path: '/CAR' }), ids(db, { path: '/car' }));
  assert.deepEqual(ids(db, { path: '/CARD', pathExact: true }), ['it', 'us', 'tr']);
  assert.deepEqual(ids(db, { referrer: 'dir' }), ids(db, { referrer: 'DIR' }));
  assert.deepEqual(ids(db, { browser: 'chrome' }), ids(db, { browser: 'Chrome' }));
});

test('IP, source and controlled actor predicates retain their existing semantics', () => {
  const db = seeded();
  const { where } = buildEventFilter({
    ip: '203.0.113.',
    source: NATIVE_SOURCE,
    actor: 'human',
  });

  assert.match(where, /ip_address LIKE \?/);
  assert.ok(!/ip_address COLLATE NOCASE/.test(where));
  assert.match(where, /event_source = \?/);
  assert.ok(!/event_source COLLATE NOCASE/.test(where));
  assert.deepEqual(ids(db, { ip: '203.0.113.' }), ['it', 'us', 'tr']);
  assert.deepEqual(ids(db, { ip: '203.0.113.7', ipExact: true }), ['it', 'us', 'tr']);
  assert.deepEqual(ids(db, { source: NATIVE_SOURCE }), ['it', 'us', 'tr']);
  assert.deepEqual(ids(db, { source: LEGACY_SOURCE }), ['legacy']);
  assert.deepEqual(ids(db, { source: 'NATIVE' }), []);
});

test('date bounds, pagination and count use the same case-insensitive filters', () => {
  const db = seeded();
  insert(db, { id: 'outside', at: BASE - 10_000, country: 'TR' });
  const range = { start: BASE, end: BASE + 10_000 };

  assert.deepEqual(ids(db, { country: 'tr' }, 1, 0, range), ['tr']);
  assert.deepEqual(ids(db, { country: 'TR' }, 1, 1, range), []);
  assert.equal(count(db, { country: 'tr' }, range), 1);
  assert.equal(count(db, { country: 'TR' }, range), 1);
});
