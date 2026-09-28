import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.js';
import { NOTES } from '../../apps/web/src/notes/catalog.js';
import { handlePageEvent } from '../analytics/ingest.js';

test('known Notes URLs resolve to their built HTML assets', async () => {
  const seen = [];
  const env = { ASSETS: { fetch: async (request) => {
    seen.push(new URL(request.url).pathname);
    return new Response('note page', { status: 200, headers: { 'content-type': 'text/html' } });
  } } };
  for (const path of ['/notes', ...NOTES.map((note) => `/notes/${note.slug}`)]) {
    const response = await worker.fetch(new Request(`https://hakan.run${path}`), env, {});
    assert.equal(response.status, 200, path);
  }
  assert.deepEqual(seen, ['/notes', ...NOTES.map((note) => `/notes/${note.slug}`)]);
});

test('unknown Notes paths return an HTTP 404 without invoking the asset fallback', async () => {
  const env = { ASSETS: { fetch: () => { throw new Error('asset fallback invoked'); } } };
  for (const path of ['/notes/not-a-real-note', '/notes/reachable-is-not-current/extra']) {
    const response = await worker.fetch(new Request(`https://hakan.run${path}`), env, {});
    assert.equal(response.status, 404, path);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /Note not found/);
  }
});

test('PAGE ingestion records a known note and rejects an unknown slug', async () => {
  let writes = 0;
  const env = {
    ANALYTICS_ENABLED: 'true',
    ANALYTICS_DB: { prepare: () => ({ bind: () => ({ run: async () => { writes += 1; } }) }) },
  };
  const event = (path) => new Request('https://hakan.run/api/analytics/page', {
    method: 'POST', headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
    body: JSON.stringify({ path }),
  });
  assert.equal((await handlePageEvent(event('/notes/reachable-is-not-current'), env)).status, 202);
  assert.equal((await handlePageEvent(event('/notes/not-a-real-note'), env)).status, 422);
  assert.equal(writes, 1);
});
