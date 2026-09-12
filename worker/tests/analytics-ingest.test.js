// Native PAGE ingestion at the production write boundary.

import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePageEvent } from '../analytics/ingest.js';
import { openAnalyticsDb } from './helpers.js';

const d1 = (database) => ({
  prepare: (sql) => ({
    bind: (...params) => ({
      run: async () => database.prepare(sql).run(...params),
    }),
  }),
});

const request = (path) => new Request('https://hakan.run/api/analytics/page', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'CF-Connecting-IP': '203.0.113.7',
    'CF-Ray': 'test-ray',
    'user-agent': 'Mozilla/5.0 Chrome/152.0.0.0 Safari/537.36',
  },
  body: JSON.stringify({ path, referrer: 'https://example.com/from?private=value', sessionId: 'session-1' }),
});

const count = (database, source = null) => Number(
  source
    ? database.prepare('SELECT COUNT(*) AS value FROM visitor_events WHERE event_source = ?').get(source).value
    : database.prepare('SELECT COUNT(*) AS value FROM visitor_events').get().value,
);

test('ANALYTICS_ENABLED=false prevents native writes', async () => {
  const database = openAnalyticsDb();
  const response = await handlePageEvent(request('/'), {
    ANALYTICS_ENABLED: 'false',
    ANALYTICS_DB: d1(database),
  });

  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { status: 'disabled' });
  assert.equal(count(database), 0);
});

test('ANALYTICS_ENABLED=true records every canonical production page as native', async () => {
  const database = openAnalyticsDb();
  const env = { ANALYTICS_ENABLED: 'true', ANALYTICS_DB: d1(database) };

  for (const path of ['/', '/contact', '/card']) {
    const response = await handlePageEvent(request(path), env);
    assert.equal(response.status, 202, path);
    assert.deepEqual(await response.json(), { status: 'recorded' });
  }

  assert.equal(count(database), 3);
  assert.equal(count(database, 'native'), 3);
  assert.deepEqual(
    database.prepare('SELECT path FROM visitor_events ORDER BY occurred_at, rowid').all().map((row) => row.path),
    ['/', '/contact', '/card'],
  );
});

test('assets, APIs and private routes cannot become PAGE events', async () => {
  const database = openAnalyticsDb();
  const env = { ANALYTICS_ENABLED: 'true', ANALYTICS_DB: d1(database) };

  for (const path of ['/assets/index.js', '/api/content', '/api/boss/analytics/events', '/boss']) {
    const response = await handlePageEvent(request(path), env);
    assert.equal(response.status, 422, path);
  }

  assert.equal(count(database), 0);
});

test('native ingestion leaves imported legacy rows untouched', async () => {
  const database = openAnalyticsDb();
  database.prepare(
    `INSERT INTO visitor_events
      (id, occurred_at, date_local, ip_address, country, region, city, colo, path,
       referrer_origin, user_agent, browser_family, device_class, actor_class,
       classification_source, session_id, request_id, event_source)
     VALUES ('legacy-1', 1, '2026-01-01', '203.0.113.8', 'US', NULL, NULL, 'LAX', '/',
             'direct', 'legacy', 'Other', 'unknown', 'unknown', 'none', 'legacy', NULL,
             'legacy_panel')`,
  ).run();

  const response = await handlePageEvent(request('/'), {
    ANALYTICS_ENABLED: 'true',
    ANALYTICS_DB: d1(database),
  });

  assert.equal(response.status, 202);
  assert.equal(count(database, 'legacy_panel'), 1);
  assert.equal(count(database, 'native'), 1);
});
