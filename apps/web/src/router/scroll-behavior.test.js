import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveScrollBehavior } from './scroll-behavior.js';

test('a smooth section link scrolls smoothly unless the user prefers reduced motion', () => {
  assert.equal(resolveScrollBehavior('smooth', false), 'smooth');
  assert.equal(resolveScrollBehavior('smooth', true), 'auto');
});

test('any other request scrolls instantly whatever the preference', () => {
  for (const requested of ['auto', undefined, null, 'instant', 'SMOOTH']) {
    assert.equal(resolveScrollBehavior(requested, false), 'auto');
    assert.equal(resolveScrollBehavior(requested, true), 'auto');
  }
});
