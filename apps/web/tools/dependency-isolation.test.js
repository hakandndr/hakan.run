// The isolation check must be able to fail, and must fail for the reason that
// actually occurred: a link whose real path leaves the repository.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isInsideRepository, isolationProblem } from './dependency-isolation.js';

const root = path.resolve('/projects/app');

test('a path inside the repository is inside it', () => {
  assert.equal(isInsideRepository(root, path.join(root, 'node_modules/vite'), false), true);
  assert.equal(isInsideRepository(root, path.join(root, 'apps/web/node_modules/vite'), false), true);
});

test('the repository root itself counts as inside', () => {
  assert.equal(isInsideRepository(root, root, false), true);
});

test('a sibling that merely shares a prefix is outside', () => {
  // The case this project actually has: app and app-next side by side.
  assert.equal(isInsideRepository(root, path.resolve('/projects/app-next/node_modules/vite'), false), false);
});

test('an unrelated checkout is outside', () => {
  assert.equal(isInsideRepository(root, path.resolve('/elsewhere/legacy/node_modules/vite'), false), false);
});

test('case sensitivity follows the filesystem, explicitly either way', () => {
  const shouty = path.resolve('/PROJECTS/APP/node_modules/vite');
  assert.equal(isInsideRepository(root, shouty, true), true, 'case-insensitive filesystems match');
  assert.equal(isInsideRepository(root, shouty, false), false, 'case-sensitive filesystems do not');
});

test('a real directory inside the repository reports no problem', () => {
  const repository = fs.mkdtempSync(path.join(os.tmpdir(), 'hakan-run-isolation-'));
  const dependency = path.join(repository, 'node_modules', 'vite');
  fs.mkdirSync(dependency, { recursive: true });
  assert.equal(isolationProblem(repository, dependency, 'vite'), null);
});

test('a link that leaves the repository is reported, which plain paths would miss', (t) => {
  const repository = fs.mkdtempSync(path.join(os.tmpdir(), 'hakan-run-isolation-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'hakan-run-outside-'));
  const real = path.join(outside, 'node_modules', 'vite');
  fs.mkdirSync(real, { recursive: true });

  const link = path.join(repository, 'node_modules');
  try {
    fs.symlinkSync(path.join(outside, 'node_modules'), link, 'junction');
  } catch (error) {
    // Creating a directory link can require privileges. The check itself is
    // still covered by the path tests above; only this reproduction is skipped.
    t.skip(`cannot create a directory link here (${error.code})`);
    return;
  }

  const viaLink = path.join(link, 'vite');
  // Without resolving the link the path looks like it is inside the repository.
  assert.equal(isInsideRepository(repository, viaLink, false), true);
  // Resolving it is what exposes the escape.
  const problem = isolationProblem(repository, viaLink, 'vite');
  assert.ok(problem, 'a link out of the repository must be reported');
  assert.match(problem, /resolves outside this repository/);
  assert.ok(problem.includes(fs.realpathSync(real)));
});

test('an unresolvable path is reported rather than assumed fine', () => {
  const repository = fs.mkdtempSync(path.join(os.tmpdir(), 'hakan-run-isolation-'));
  const problem = isolationProblem(repository, path.join(repository, 'node_modules', 'absent'), 'vite');
  assert.ok(problem);
  assert.match(problem, /could not resolve a real path/);
});
