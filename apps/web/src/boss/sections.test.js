// The Boss section list is a contract with the Worker, and the route table is
// generated from it, so a drift here is a route that exists in one half only.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOSS_BASE,
  BOSS_SECTIONS,
  bossSectionIds,
  isBossPath,
  normalizeBossPath,
  sectionForPath,
} from './sections.js';

// The same literal the Worker asserts in worker/tests/boss-authorization.test.js.
const CANONICAL = ['dashboard', 'analytics', 'content', 'submissions', 'audit', 'system'];

test('the sections are exactly the six canonical Boss modules, in order', () => {
  assert.deepEqual(bossSectionIds(), CANONICAL);
});

test('every section declares a path, a label and a summary', () => {
  for (const section of BOSS_SECTIONS) {
    assert.ok(section.path.startsWith(BOSS_BASE), `${section.id} must live under ${BOSS_BASE}`);
    assert.ok(section.label.length > 0, `${section.id} needs a label`);
    assert.ok(section.summary.length > 0, `${section.id} needs a summary`);
  }
});

test('dashboard is the landing route', () => {
  assert.equal(BOSS_SECTIONS[0].id, 'dashboard');
  assert.equal(BOSS_SECTIONS[0].path, BOSS_BASE);
});

test('paths are unique', () => {
  const paths = BOSS_SECTIONS.map((section) => section.path);
  assert.equal(new Set(paths).size, paths.length);
});

test('no section reintroduces the legacy private surface', () => {
  for (const section of BOSS_SECTIONS) {
    assert.ok(!section.path.includes('control-room'));
    assert.ok(!section.path.includes('admin'));
  }
});

test('a trailing slash is the same route', () => {
  assert.equal(normalizeBossPath('/boss/'), '/boss');
  assert.equal(sectionForPath('/boss/')?.id, 'dashboard');
  assert.equal(sectionForPath('/boss/analytics/')?.id, 'analytics');
});

test('query strings and fragments do not change the section', () => {
  assert.equal(sectionForPath('/boss/analytics?from=2026-09-01')?.id, 'analytics');
  assert.equal(sectionForPath('/boss/audit#top')?.id, 'audit');
});

test('an unknown Boss path resolves to no section', () => {
  assert.equal(sectionForPath('/boss/nope'), null);
  assert.equal(sectionForPath('/'), null);
  assert.equal(sectionForPath('/contact'), null);
});

test('isBossPath covers the shell and its sections and nothing else', () => {
  assert.equal(isBossPath('/boss'), true);
  assert.equal(isBossPath('/boss/'), true);
  assert.equal(isBossPath('/boss/system'), true);
  assert.equal(isBossPath('/boss/anything/deeper'), true);
  assert.equal(isBossPath('/'), false);
  assert.equal(isBossPath('/contact'), false);
  // A public route that merely starts with the same letters is not the shell.
  assert.equal(isBossPath('/bossa-nova'), false);
});
