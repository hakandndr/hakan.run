import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizePagePath,
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

test('records only on the staging hostname', () => {
  assert.equal(shouldTrackPage('staging.hakan.run', '/'), true);
  assert.equal(shouldTrackPage('staging.hakan.run', '/card'), true);
  assert.equal(shouldTrackPage('staging.hakan.run', '/contact'), true);
  assert.equal(shouldTrackPage('hakan.run', '/'), false);
  assert.equal(shouldTrackPage('localhost', '/'), false);
  assert.equal(shouldTrackPage('staging.hakan.run', '/boss'), false);
});
