// The failure modes here are the ones this project actually hit: the asset
// layer answering a Boss path with the public HTML shell, and the Worker
// refusing a request the edge had already allowed. Both must surface as errors.

import test from 'node:test';
import assert from 'node:assert/strict';
import { BossApiError, bossQuery, fetchBoss, interpretResponse } from './api.js';

const response = ({ ok = true, status = 200, redirected = false, contentType = 'application/json; charset=utf-8', body = {} } = {}) => ({
  ok,
  status,
  redirected,
  headers: { get: (name) => (name.toLowerCase() === 'content-type' ? contentType : null) },
  json: async () => body,
});

test('a JSON success is accepted', () => {
  assert.deepEqual(
    interpretResponse({ ok: true, status: 200, redirected: false, contentType: 'application/json', payload: {} }),
    { kind: 'ok' },
  );
});

test('HTML is an error, not empty data', () => {
  // The exact symptom of a Boss path answered by the single-page-application
  // fallback instead of the Worker.
  const verdict = interpretResponse({ ok: true, status: 200, redirected: false, contentType: 'text/html', payload: null });
  assert.equal(verdict.kind, 'error');
  assert.equal(verdict.code, 'not_json');
  assert.match(verdict.message, /did not reach the Worker/);
});

test('a redirect is reported as an expired Access session', () => {
  const verdict = interpretResponse({ ok: true, status: 200, redirected: true, contentType: 'application/json', payload: {} });
  assert.equal(verdict.kind, 'error');
  assert.equal(verdict.code, 'session_expired');
});

test('a Worker refusal keeps its reason', () => {
  const verdict = interpretResponse({
    ok: false, status: 403, redirected: false, contentType: 'application/json',
    payload: { error: 'forbidden', reason: 'verification_failed' },
  });
  assert.equal(verdict.kind, 'error');
  assert.equal(verdict.code, 'verification_failed');
  assert.match(verdict.message, /Access verification failed at the Worker/);
});

test('an unknown endpoint says so', () => {
  const verdict = interpretResponse({
    ok: false, status: 404, redirected: false, contentType: 'application/json', payload: { error: 'not_found' },
  });
  assert.equal(verdict.kind, 'error');
  assert.equal(verdict.code, 'not_found');
});

test('fetchBoss returns the payload of a JSON success', async () => {
  const payload = await fetchBoss('/api/boss/dashboard', {
    fetchImpl: async () => response({ body: { environment: 'staging' } }),
  });
  assert.deepEqual(payload, { environment: 'staging' });
});

test('fetchBoss sends credentials and asks for JSON', async () => {
  let seen = null;
  await fetchBoss('/api/boss/system', {
    fetchImpl: async (path, options) => { seen = { path, options }; return response(); },
  });
  assert.equal(seen.path, '/api/boss/system');
  assert.equal(seen.options.credentials, 'same-origin');
  assert.equal(seen.options.cache, 'no-store');
  assert.equal(seen.options.headers.accept, 'application/json');
});

test('fetchBoss throws a described error for an HTML answer', async () => {
  await assert.rejects(
    () => fetchBoss('/api/boss/system', { fetchImpl: async () => response({ contentType: 'text/html' }) }),
    (error) => {
      assert.ok(error instanceof BossApiError);
      assert.equal(error.code, 'not_json');
      assert.equal(error.path, '/api/boss/system');
      return true;
    },
  );
});

test('fetchBoss throws for a Worker refusal', async () => {
  await assert.rejects(
    () => fetchBoss('/api/boss/audit', {
      fetchImpl: async () => response({ ok: false, status: 403, body: { error: 'forbidden', reason: 'not_owner' } }),
    }),
    (error) => {
      assert.equal(error.status, 403);
      assert.equal(error.code, 'not_owner');
      return true;
    },
  );
});

test('a network failure is reported rather than swallowed', async () => {
  await assert.rejects(
    () => fetchBoss('/api/boss/content', {
      fetchImpl: async () => { throw new TypeError('Failed to fetch'); },
    }),
    (error) => {
      assert.equal(error.code, 'network_error');
      assert.match(error.message, /Could not reach the Boss API/);
      return true;
    },
  );
});

test('an abort is propagated, not turned into an error state', async () => {
  const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
  await assert.rejects(
    () => fetchBoss('/api/boss/content', { fetchImpl: async () => { throw abort; } }),
    (error) => error.name === 'AbortError',
  );
});

test('malformed JSON is reported', async () => {
  await assert.rejects(
    () => fetchBoss('/api/boss/system', {
      fetchImpl: async () => ({ ...response(), json: async () => { throw new SyntaxError('bad'); } }),
    }),
    (error) => error.code === 'malformed_json',
  );
});

test('bossQuery omits empty values and encodes the rest', () => {
  assert.equal(bossQuery({}), '');
  assert.equal(bossQuery({ from: '', to: undefined, page: null }), '');
  assert.equal(bossQuery({ from: '2026-09-01', to: '2026-09-04' }), '?from=2026-09-01&to=2026-09-04');
  assert.equal(bossQuery({ path: '/project/a b' }), '?path=%2Fproject%2Fa+b');
});
