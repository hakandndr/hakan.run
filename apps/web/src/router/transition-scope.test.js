import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canStartViewTransition,
  commitInRouteTransition,
  isRouteTransitionCommit,
  shouldTransitionRoute,
} from './transition-scope.js';

test('pathname changes into, within and out of Notes transition', () => {
  for (const [from, to] of [
    ['/', '/notes'],
    ['/', '/notes/reachable-is-not-current'],
    ['/notes', '/notes/reachable-is-not-current'],
    ['/notes/reachable-is-not-current', '/notes'],
    ['/notes/a-write-path-for-a-mostly-static-site', '/notes/reachable-is-not-current'],
    ['/notes', '/'],
  ]) assert.equal(shouldTransitionRoute(from, to), true, `${from} -> ${to}`);
});

test('hash-only, unrelated and self-animating destinations do not transition', () => {
  for (const [from, to] of [
    ['/', '/'],
    ['/notes', '/notes'],
    ['/', '/contact'],
    ['/notes', '/contact'],
    ['/contact', '/notes'],
    ['/notes', '/card'],
    ['/contact', '/'],
  ]) assert.equal(shouldTransitionRoute(from, to), false, `${from} -> ${to}`);
});

test('view transitions require the API and no reduced-motion preference', () => {
  const environment = (supported, reduce) => ({
    document: supported ? { startViewTransition() {} } : {},
    matchMedia: (query) => ({ matches: reduce && query === '(prefers-reduced-motion: reduce)' }),
  });
  assert.equal(canStartViewTransition(environment(true, false)), true);
  assert.equal(canStartViewTransition(environment(true, true)), false);
  assert.equal(canStartViewTransition(environment(false, false)), false);
});

test('the transition-commit flag is set only for the duration of the commit', () => {
  let during = null;
  commitInRouteTransition(() => { during = isRouteTransitionCommit(); });
  assert.equal(during, true);
  assert.equal(isRouteTransitionCommit(), false);
  assert.throws(() => commitInRouteTransition(() => { throw new Error('commit failed'); }));
  assert.equal(isRouteTransitionCommit(), false);
});
