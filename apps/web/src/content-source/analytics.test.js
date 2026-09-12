import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizePagePath,
  recordPageView,
  shouldTrackPage,
} from './analytics.js';

test('normalizes supported public paths', () => {
  assert.equal(normalizePagePath('/'), '/');
  assert.equal(normalizePagePath('/card/'), '/card');
  assert.equal(normalizePagePath('/contact/'), '/contact');
  assert.equal(normalizePagePath('/project/dndr-labs/'), '/project/dndr-labs');
});

test('rejects private, API, asset and unknown routes', () => {
  for (const path of [
    '/boss',
    '/boss/analytics',
    '/api/content',
    '/control-room',
    '/admin',
    '/assets/index.js',
    '/missing',
    '/project/',
    '/project/example/extra',
  ]) {
    assert.equal(normalizePagePath(path), null, path);
  }
});

test('records canonical pages on the explicit production and staging hostnames', () => {
  for (const hostname of ['hakan.run', 'staging.hakan.run']) {
    assert.equal(shouldTrackPage(hostname, '/'), true);
    assert.equal(shouldTrackPage(hostname, '/card'), true);
    assert.equal(shouldTrackPage(hostname, '/contact'), true);
  }
  assert.equal(shouldTrackPage('localhost', '/'), false);
  assert.equal(shouldTrackPage('www.hakan.run', '/'), false);
  assert.equal(shouldTrackPage('staging.hakan.run', '/boss'), false);
});

test('a production page view emits the canonical analytics request', async () => {
  const original = {
    document: globalThis.document,
    fetch: globalThis.fetch,
    sessionStorage: globalThis.sessionStorage,
  };
  const requests = [];

  globalThis.document = { referrer: 'https://example.com/source?private=value' };
  globalThis.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
  };
  globalThis.fetch = async (path, options) => {
    requests.push({ path, options });
    return new Response(null, { status: 202 });
  };

  try {
    assert.equal(recordPageView('/contact/', { hostname: 'hakan.run' }), true);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, '/api/analytics/page');
    assert.equal(requests[0].options.method, 'POST');
    assert.equal(JSON.parse(requests[0].options.body).path, '/contact');
  } finally {
    globalThis.document = original.document;
    globalThis.fetch = original.fetch;
    globalThis.sessionStorage = original.sessionStorage;
  }
});
