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
