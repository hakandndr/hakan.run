// Public runtime configuration: one non-secret value, and no more.

import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.js';

const request = (path, init) => new Request(`https://staging.hakan.run${path}`, init);

const env = {
  ENVIRONMENT: 'staging',
  TURNSTILE_SITE_KEY: '0x4AAAAAAEm_dH-JFfwoJxQ0',
  TURNSTILE_SECRET_KEY: 'secret-value-that-must-never-leave',
  ACCESS_AUD_BOSS: 'aud',
  BOSS_OWNER_EMAIL: 'hakan@dndr.net',
};

test('the site key is served, without Access', async () => {
  const response = await worker.fetch(request('/api/config'), env, {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    contract: 1,
    environment: 'staging',
    turnstileSiteKey: '0x4AAAAAAEm_dH-JFfwoJxQ0',
  });
});

test('no secret is exposed by the endpoint that exposes configuration', async () => {
  const response = await worker.fetch(request('/api/config'), env, {});
  const body = await response.text();
  assert.ok(!body.includes(env.TURNSTILE_SECRET_KEY));
  assert.ok(!/secret/i.test(body));
  // The response is enumerated, not passed through: a new Worker variable can
  // never become public by accident.
  assert.deepEqual(Object.keys(JSON.parse(body)).sort(), ['contract', 'environment', 'turnstileSiteKey']);
});

test('an unset site key is null, not an empty string', async () => {
  // A client must be able to tell "not configured" from "configured as nothing",
  // because the first means the form cannot be sent and should say so.
  const response = await worker.fetch(request('/api/config'), { ENVIRONMENT: 'staging' }, {});
  assert.equal((await response.json()).turnstileSiteKey, null);
});

test('a write method is rejected rather than routed', async () => {
  const response = await worker.fetch(request('/api/config', { method: 'POST' }), env, {});
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});

test('the configuration is publicly cacheable', async () => {
  const response = await worker.fetch(request('/api/config'), env, {});
  assert.match(response.headers.get('cache-control'), /public/);
});

test('the site key is not smuggled into the content contract', async () => {
  const response = await worker.fetch(
    request('/api/content'),
    { ...env, APP_DB: { prepare: () => ({ bind: () => ({ all: async () => ({ results: [] }) }) }) } },
    {},
  );
  const body = await response.text();
  assert.ok(!body.includes('turnstile'), 'a site key is configuration, not content');
});
