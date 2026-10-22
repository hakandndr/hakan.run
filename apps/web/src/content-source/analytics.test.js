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
  assert.equal(normalizePagePath('/notes/'), '/notes');
  assert.equal(normalizePagePath('/notes/reachable-is-not-current/'), '/notes/reachable-is-not-current');
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
    '/project/example',
    '/project/dndr-labs/',
    '/project/example/extra',
    '/notes/not-a-real-note',
  ]) {
    assert.equal(normalizePagePath(path), null, path);
  }
});

test('records canonical pages on the explicit production and staging hostnames', () => {
  for (const hostname of ['hakan.run', 'staging.hakan.run']) {
    assert.equal(shouldTrackPage(hostname, '/'), true);
    assert.equal(shouldTrackPage(hostname, '/card'), true);
    assert.equal(shouldTrackPage(hostname, '/contact'), true);
    assert.equal(shouldTrackPage(hostname, '/notes'), true);
    assert.equal(shouldTrackPage(hostname, '/notes/reachable-is-not-current'), true);
    assert.equal(shouldTrackPage(hostname, '/notes/not-a-real-note'), false);
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

test('a removed project page or an unknown route sends no PAGE event, and pages still do once', async () => {
  const original = {
    document: globalThis.document,
    fetch: globalThis.fetch,
    sessionStorage: globalThis.sessionStorage,
  };
  const requests = [];
  globalThis.document = { referrer: '' };
  globalThis.sessionStorage = { getItem: () => 'session-1', setItem: () => {} };
  globalThis.fetch = async (path, options) => {
    requests.push(JSON.parse(options.body).path);
    return new Response(null, { status: 202 });
  };

  try {
    assert.equal(recordPageView('/project/example', { hostname: 'hakan.run' }), false);
    assert.equal(recordPageView('/notes/not-a-real-note', { hostname: 'hakan.run' }), false);
    assert.equal(recordPageView('/no-such-page', { hostname: 'hakan.run' }), false);
    assert.deepEqual(requests, []);

    assert.equal(recordPageView('/notes', { hostname: 'hakan.run' }), true);
    // The same route again is a remount, not a new view.
    assert.equal(recordPageView('/notes/', { hostname: 'hakan.run' }), false);
    assert.equal(recordPageView('/project/example', { hostname: 'hakan.run' }), false);
    // Leaving to a page that is not one resets the duplicate guard.
    assert.equal(recordPageView('/notes', { hostname: 'hakan.run' }), true);
    assert.deepEqual(requests, ['/notes', '/notes']);
  } finally {
    globalThis.document = original.document;
    globalThis.fetch = original.fetch;
    globalThis.sessionStorage = original.sessionStorage;
  }
});
