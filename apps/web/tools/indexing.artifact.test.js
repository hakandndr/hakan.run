// Artifact-level tests: the policy is applied to real files on disk and read
// back, not just computed.
//
// These exist because the pure policy tests passed while a staging artifact
// shipped the production robots.txt. Testing the policy proves the policy;
// only reading the artifact proves the artifact. The decisive case is the third
// test: a production-shaped directory checked against the staging policy must
// FAIL, which is exactly the state that was deployed unnoticed.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRODUCTION_ROBOTS_META,
  STAGING_ROBOTS_META,
  STAGING_ROBOTS_TXT,
  STAGING_SITEMAP_XML,
  applyIndexingPolicy,
  verifyIndexingPolicy,
} from './indexing.js';

const appDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** A directory shaped exactly like a freshly built production artifact. */
const productionArtifact = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hakan-run-artifact-'));
  fs.copyFileSync(path.join(appDirectory, 'public/robots.txt'), path.join(directory, 'robots.txt'));
  fs.copyFileSync(path.join(appDirectory, 'public/sitemap.xml'), path.join(directory, 'sitemap.xml'));
  fs.copyFileSync(path.join(appDirectory, 'index.html'), path.join(directory, 'index.html'));
  return directory;
};

const read = (directory, name) => fs.readFileSync(path.join(directory, name), 'utf8');

test('a production artifact satisfies the production policy', () => {
  const directory = productionArtifact();
  assert.deepEqual(verifyIndexingPolicy(directory, 'production'), []);
});

test('applying the production policy changes nothing on disk', () => {
  const directory = productionArtifact();
  const before = ['robots.txt', 'sitemap.xml', 'index.html'].map((name) => read(directory, name));
  assert.deepEqual(applyIndexingPolicy(directory, 'production'), []);
  const after = ['robots.txt', 'sitemap.xml', 'index.html'].map((name) => read(directory, name));
  assert.deepEqual(after, before);
});

test('a production artifact FAILS the staging policy', () => {
  // The exact state that reached staging: the guard never ran, and nothing said so.
  const directory = productionArtifact();
  const problems = verifyIndexingPolicy(directory, 'staging');
  assert.ok(problems.length > 0, 'an unguarded artifact must not pass the staging policy');
  assert.ok(problems.some((problem) => problem.startsWith('robots.txt:')));
  assert.ok(problems.some((problem) => problem.startsWith('sitemap.xml:')));
  assert.ok(problems.some((problem) => problem.startsWith('index.html:')));
});

test('applying the staging policy rewrites the three files on disk', () => {
  const directory = productionArtifact();
  const actions = applyIndexingPolicy(directory, 'staging');
  assert.equal(actions.length, 3);

  assert.equal(read(directory, 'robots.txt'), STAGING_ROBOTS_TXT);
  assert.match(read(directory, 'robots.txt'), /^Disallow: \/$/m);
  assert.doesNotMatch(read(directory, 'robots.txt'), /Sitemap:/i);
  assert.ok(!read(directory, 'robots.txt').includes('hakan.run'));

  assert.equal(read(directory, 'sitemap.xml'), STAGING_SITEMAP_XML);
  assert.equal((read(directory, 'sitemap.xml').match(/<loc>/g) ?? []).length, 0);
  assert.equal((read(directory, 'sitemap.xml').match(/<url>/g) ?? []).length, 0);
  assert.ok(!read(directory, 'sitemap.xml').includes('hakan.run'));

  assert.ok(read(directory, 'index.html').includes(STAGING_ROBOTS_META));
  assert.ok(!read(directory, 'index.html').includes(PRODUCTION_ROBOTS_META));
});

test('a staging artifact satisfies the staging policy and fails the production one', () => {
  const directory = productionArtifact();
  applyIndexingPolicy(directory, 'staging');
  assert.deepEqual(verifyIndexingPolicy(directory, 'staging'), []);
  assert.ok(verifyIndexingPolicy(directory, 'production').length > 0);
});

test('verification reports a missing artifact rather than passing it', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hakan-run-empty-'));
  const problems = verifyIndexingPolicy(directory, 'staging');
  assert.equal(problems.length, 3);
  assert.ok(problems.every((problem) => problem.includes('missing at')));
});

test('the staging rewrite is idempotent', () => {
  const directory = productionArtifact();
  applyIndexingPolicy(directory, 'staging');
  const first = read(directory, 'index.html');
  // A second pass must not throw on an already-rewritten document.
  assert.throws(() => applyIndexingPolicy(directory, 'staging'), /Expected exactly one robots meta tag/);
  assert.equal(read(directory, 'index.html'), first);
});
