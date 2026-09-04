// Local-day semantics and the PAGE-only write boundary.

import test from 'node:test';
import assert from 'node:assert/strict';
import { localDay, localDayBounds, localDayRange, shiftDay, daysBetween } from '../lib/time.js';
import { isPublicPage, normalizePath } from '../lib/routes.js';

test('a local day is exactly 24 hours outside daylight-saving transitions', () => {
  const { start, end } = localDayBounds('2026-06-15');
  assert.equal(end - start, 24 * 3_600_000);
});

test('the spring-forward day is 23 hours and still starts at local midnight', () => {
  // US daylight saving begins on the second Sunday in March.
  const { start, end } = localDayBounds('2026-03-08');
  assert.equal(end - start, 23 * 3_600_000);
  assert.equal(localDay(start), '2026-03-08');
  assert.equal(localDay(start - 1), '2026-03-07');
});

test('the fall-back day is 25 hours', () => {
  const { start, end } = localDayBounds('2026-11-01');
  assert.equal(end - start, 25 * 3_600_000);
});

test('an instant just before local midnight belongs to the previous day', () => {
  const { start } = localDayBounds('2026-09-02');
  assert.equal(localDay(start), '2026-09-02');
  assert.equal(localDay(start - 1), '2026-09-01');
});

test('day ranges are inclusive and bounded', () => {
  assert.deepEqual(localDayRange('2026-09-01', '2026-09-03'), [
    '2026-09-01', '2026-09-02', '2026-09-03',
  ]);
  assert.equal(localDayRange('2026-01-01', '2030-01-01'), null, 'an absurd range is refused');
  assert.equal(shiftDay('2026-02-28', 1), '2026-03-01');
  assert.equal(daysBetween('2026-09-01', '2026-09-11'), 10);
});

test('only public pages are recordable', () => {
  for (const path of ['/', '/contact', '/project/full-stack-development']) {
    assert.equal(isPublicPage(path), true, `${path} should be recordable`);
  }
  for (const path of ['/assets/index.js', '/api/boss/system', '/boss', '/run/get_log.php',
                      '/project/', '/project/Bad_Slug', '/control-room']) {
    assert.equal(isPublicPage(path), false, `${path} must never reach the event table`);
  }
});

test('paths are normalized before the public-page check', () => {
  assert.equal(normalizePath('//contact//'), '/contact');
  assert.equal(normalizePath('/contact?utm=x#top'), '/contact');
  assert.equal(normalizePath(''), '/');
});
