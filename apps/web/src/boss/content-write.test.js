import test from 'node:test';
import assert from 'node:assert/strict';
import { mutateBoss, BossApiError } from './api.js';

test('content mutations send JSON and same-origin credentials', async () => {
  let captured;
  const response = await mutateBoss('/api/boss/content/hero/draft', {
    method: 'PUT',
    body: { expectedVersion: 1, expectedRevision: 1, data: { headingLine1: 'New' } },
    fetchImpl: async (path, options) => {
      captured = { path, options };
      return new Response(JSON.stringify({ section: 'hero' }), {
        status: 200, headers: { 'content-type': 'application/json' },
      });
    },
  });
  assert.equal(captured.path, '/api/boss/content/hero/draft');
  assert.equal(captured.options.credentials, 'same-origin');
  assert.equal(captured.options.method, 'PUT');
  assert.equal(captured.options.cache, 'no-store');
  assert.deepEqual(JSON.parse(captured.options.body).data, { headingLine1: 'New' });
  assert.equal(response.section, 'hero');
});

test('content conflicts remain typed errors', async () => {
  await assert.rejects(
    mutateBoss('/api/boss/content/hero/draft', {
      body: {},
      fetchImpl: async () => new Response(JSON.stringify({ error: 'content_conflict' }), {
        status: 409, headers: { 'content-type': 'application/json' },
      }),
    }),
    (error) => error instanceof BossApiError && error.status === 409 && error.code === 'content_conflict',
  );
});

test('HTML or redirected responses never become successful mutations', async () => {
  await assert.rejects(
    mutateBoss('/api/boss/content/hero/publish', {
      body: {},
      fetchImpl: async () => new Response('<html>login</html>', {
        status: 200, headers: { 'content-type': 'text/html' },
      }),
    }),
    (error) => error instanceof BossApiError && error.code === 'not_json',
  );
});
