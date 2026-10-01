// DNDR Analytics V2 dual-write: additive, staging-only, failure-isolated, and
// keyed on the source row id. Addresses are from documentation ranges.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handlePageEvent } from '../analytics/ingest.js';
import {
  DNDR_FORWARD_ATTEMPTS, dndrForwardingEnabled, forwardToDndr, forwardedReferrer, producerEventId,
} from '../analytics/dndr-forward.js';
import { openAnalyticsDb } from './helpers.js';

const d1 = (database, { fail = false } = {}) => ({
  prepare: (sql) => ({
    bind: (...params) => ({
      run: async () => {
        if (fail) throw new Error('D1 unavailable');
        return database.prepare(sql).run(...params);
      },
    }),
  }),
});

const request = (path, referrer = 'https://www.google.com/search?q=private', host = 'staging.hakan.run') => {
  const r = new Request(`https://${host}/api/analytics/page`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'CF-Connecting-IP': '203.0.113.17',
      'CF-Ray': 'test-ray',
      'user-agent': 'Mozilla/5.0 Chrome/152.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({ path, referrer, sessionId: 'session-1', site: 'site_dndr_net', producerId: 'prd_x' }),
  });
  Object.defineProperty(r, 'cf', { value: { country: 'US', region: 'California', regionCode: 'CA', city: 'Irvine', asn: 64496 } });
  return r;
};

const collector = (result = { status: 'accepted' }) => {
  const calls = [];
  return {
    calls,
    async recordPage(event) {
      calls.push(event);
      return typeof result === 'function' ? result() : result;
    },
  };
};

const context = () => {
  const pending = [];
  return { pending, waitUntil: (promise) => pending.push(promise), settled: () => Promise.all(pending) };
};

const staging = (database, extra = {}) => ({ ANALYTICS_ENABLED: 'true', ENVIRONMENT: 'staging', ANALYTICS_DB: d1(database), ...extra });

test('the source row is written first and forwarded with its own id', async () => {
  const database = openAnalyticsDb();
  const dndr = collector();
  const ctx = context();
  const response = await handlePageEvent(request('/contact'), staging(database, { DNDR_COLLECTOR: dndr }), ctx);
  await ctx.settled();
  assert.equal(response.status, 202);
  const row = database.prepare('SELECT id, path, ip_address, referrer_origin, event_source FROM visitor_events').get();
  assert.equal(row.event_source, 'native');
  assert.deepEqual(dndr.calls, [{
    producerEventId: `visitor_events:${row.id}`,
    hostname: 'staging.hakan.run',
    path: '/contact',
    referrer: 'https://www.google.com',
    ip: '203.0.113.17',
    userAgent: 'Mozilla/5.0 Chrome/152.0.0.0 Safari/537.36',
    country: 'US',
    region: 'California',
    regionCode: 'CA',
    city: 'Irvine',
    asn: 64496,
  }]);
  assert.equal(Object.keys(dndr.calls[0]).includes('producerId'), false, 'the payload names no producer');
});

test('the source write is unchanged with or without DNDR', async () => {
  const plain = openAnalyticsDb();
  const forwarded = openAnalyticsDb();
  await handlePageEvent(request('/'), { ANALYTICS_ENABLED: 'true', ANALYTICS_DB: d1(plain) });
  const ctx = context();
  await handlePageEvent(request('/'), staging(forwarded, { DNDR_COLLECTOR: collector() }), ctx);
  await ctx.settled();
  const strip = (db) => {
    const row = { ...db.prepare('SELECT * FROM visitor_events').get() };
    delete row.id; delete row.occurred_at; delete row.date_local;
    return row;
  };
  assert.deepEqual(strip(forwarded), strip(plain));
});

test('production and development never forward, and a failed source write is never forwarded', async () => {
  for (const ENVIRONMENT of ['production', 'development', undefined]) {
    const dndr = collector();
    const ctx = context();
    await handlePageEvent(request('/'), { ...staging(openAnalyticsDb(), { DNDR_COLLECTOR: dndr }), ENVIRONMENT }, ctx);
    await ctx.settled();
    assert.equal(dndr.calls.length, 0, String(ENVIRONMENT));
  }
  const dndr = collector();
  const ctx = context();
  await assert.rejects(() => handlePageEvent(request('/'), { ...staging(openAnalyticsDb(), { DNDR_COLLECTOR: dndr }), ANALYTICS_DB: d1(openAnalyticsDb(), { fail: true }) }, ctx));
  assert.equal(dndr.calls.length, 0);
  assert.equal(dndrForwardingEnabled({ ENVIRONMENT: 'staging', DNDR_COLLECTOR: {} }), false);
});

test('a failing collector never changes the response or the row; a failed call is retried once with the same id', async () => {
  const quiet = [console.log, console.error];
  console.log = () => {};
  console.error = () => {};
  try {
    for (const failing of [
      collector(async () => { throw new Error('binding unavailable'); }),
      collector({ status: 'error', reason: 'write_failed' }),
      collector({ status: 'rejected', reason: 'producer_disabled' }),
      collector(async () => undefined),
    ]) {
      const database = openAnalyticsDb();
      const ctx = context();
      const response = await handlePageEvent(request('/'), staging(database, { DNDR_COLLECTOR: failing }), ctx);
      await ctx.settled();
      assert.equal(response.status, 202);
      assert.equal(database.prepare('SELECT COUNT(*) AS n FROM visitor_events').get().n, 1);
    }
    let calls = 0;
    const flaky = collector(async () => { calls += 1; if (calls === 1) throw new Error('transient'); return { status: 'accepted' }; });
    const event = { producerEventId: 'visitor_events:abc', hostname: 'staging.hakan.run', path: '/', ip: '203.0.113.1' };
    assert.equal(await forwardToDndr({ DNDR_COLLECTOR: flaky }, event), 'accepted');
    assert.deepEqual(flaky.calls.map((e) => e.producerEventId), ['visitor_events:abc', 'visitor_events:abc']);
    assert.equal(DNDR_FORWARD_ATTEMPTS, 2);
    const refused = collector({ status: 'rejected', reason: 'producer_disabled' });
    assert.equal(await forwardToDndr({ DNDR_COLLECTOR: refused }, event), 'rejected');
    assert.equal(refused.calls.length, 1, 'a refusal is final');
  } finally {
    [console.log, console.error] = quiet;
  }
});

test('helpers and configuration', () => {
  assert.equal(producerEventId('u-1'), 'visitor_events:u-1');
  assert.equal(forwardedReferrer('direct'), '');
  assert.equal(forwardedReferrer('invalid'), null);
  assert.equal(forwardedReferrer('https://www.google.com'), 'https://www.google.com');
  const config = JSON.parse(readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8')
    .replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1'));
  assert.deepEqual(config.env.staging.services, [{
    binding: 'DNDR_COLLECTOR', service: 'dndr-collector-staging', entrypoint: 'ProducerApi',
    props: { producerId: 'prd_hakan_run_staging_binding' },
  }]);
  assert.equal(config.env.production.services, undefined);
  assert.equal(config.services, undefined);
});
