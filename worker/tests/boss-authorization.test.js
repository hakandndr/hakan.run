// Boss authorization must fail closed, and must not be satisfiable by routing.

import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.js';
import { verifyAccess } from '../lib/access.js';
import { BOSS_MODULES } from '../boss/index.js';

const request = (path, headers = {}) =>
  new Request(`https://staging.hakan.run${path}`, { headers });

const configuredEnv = {
  ACCESS_TEAM_DOMAIN: 'example.cloudflareaccess.com',
  ACCESS_AUD_BOSS: 'aud-value',
  BOSS_OWNER_EMAIL: 'hakan@dndr.net',
  ASSETS: { fetch: async () => new Response('shell', { status: 200 }) },
};

test('the canonical Boss modules are exactly the six agreed areas', () => {
  assert.deepEqual(BOSS_MODULES, [
    'dashboard', 'analytics', 'content', 'submissions', 'audit', 'system',
  ]);
});

test('an unconfigured Access binding denies rather than opening the surface', async () => {
  const result = await verifyAccess(request('/boss'), {});
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'access_not_configured');
});

// The state staging ran in between its first deployment and the deployment that
// carries the Access audience tag: team domain and owner known, audience still
// empty. That window is closed, but the assertion stays: a partially configured
// Access binding must never be treated as good enough, whether it arises from a
// provisioning gap or from a later edit that drops the audience.
test('a known team domain with no audience still denies', async () => {
  const result = await verifyAccess(request('/boss'), {
    ACCESS_TEAM_DOMAIN: 'dndrnet.cloudflareaccess.com',
    ACCESS_AUD_BOSS: '',
    BOSS_OWNER_EMAIL: 'hakan@dndr.net',
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'access_not_configured');
});

test('a missing assertion denies', async () => {
  const result = await verifyAccess(request('/boss'), configuredEnv);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'assertion_missing');
});

test('a malformed assertion denies without throwing', async () => {
  const result = await verifyAccess(
    request('/boss', { 'cf-access-jwt-assertion': 'not-a-jwt' }),
    configuredEnv,
  );
  assert.equal(result.ok, false);
});

test('the private shell is denied when verification fails, not served', async () => {
  const response = await worker.fetch(request('/boss'), configuredEnv, {});
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.error, 'forbidden');
});

test('every private API path is denied without a verified identity', async () => {
  for (const module of BOSS_MODULES) {
    const response = await worker.fetch(
      request(`/api/boss/${module}`),
      configuredEnv,
      {},
    );
    assert.equal(response.status, 403, `/api/boss/${module} must fail closed`);
  }
});

test('an unmatched API path is not found and never falls through to the shell', async () => {
  const response = await worker.fetch(request('/api/does-not-exist'), configuredEnv, {});
  assert.equal(response.status, 404);
});

test('the legacy surfaces have no route in the target', async () => {
  const assets = { fetch: async () => new Response('shell', { status: 200 }) };
  for (const path of ['/api/run/log_hakanrun.php', '/api/formspree', '/api/control-room']) {
    const response = await worker.fetch(request(path), { ...configuredEnv, ASSETS: assets }, {});
    assert.equal(response.status, 404, `${path} must not resolve`);
  }
});

// The System panel reports the two histories separately.
//
// Boss must show that imported history exists — hiding it would be its own kind
// of dishonesty — while never letting it drive the native retention promise.
test('Boss System reports native retention and legacy history as separate figures', async () => {
  const { handleBossApi } = await import('../boss/index.js');
  const rows = {
    'SELECT occurred_at AS oldest': [{ oldest: Date.now() - 86_400_000, oldest_day: '2026-09-04' }],
    'SELECT COUNT(*) AS value': [{ value: 12 }],
    'SELECT event_source AS source': [
      { source: 'legacy_panel', value: 3178, oldest: Date.UTC(2026, 4, 17) },
      { source: 'native', value: 12, oldest: Date.now() - 86_400_000 },
    ],
  };
  const pick = (sql) => Object.entries(rows).find(([prefix]) => sql.includes(prefix))?.[1] ?? [];
  const analyticsDb = {
    prepare: (sql) => ({
      bind: (...params) => ({ all: async () => ({ results: pick(sql) }), first: async () => pick(sql)[0] ?? null }),
      all: async () => ({ results: pick(sql) }),
      first: async () => pick(sql)[0] ?? null,
    }),
  };

  const response = await handleBossApi(
    new Request('https://staging.hakan.run/api/boss/system'),
    { ENVIRONMENT: 'staging', APP_DB: {}, ANALYTICS_DB: analyticsDb },
    {},
    { email: 'hakan@dndr.net' },
  );
  const body = await response.json();

  assert.equal(body.analytics.retainedEvents, 12, 'the native figure counts native events only');
  assert.equal(body.analytics.retentionOverdue, false, 'imported history must not breach the native promise');
  assert.equal(body.legacyAnalytics.retainedEvents, 3178, 'and the imported history is still visible');
  assert.equal(body.legacyAnalytics.governedByRetentionPolicy, false);
  assert.ok(body.eventSources.some((entry) => entry.source === 'legacy_panel'));
});
