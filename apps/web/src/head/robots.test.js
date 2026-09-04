// The document must carry exactly one robots directive, and only the build may
// declare it.
//
// The failure this prevents was real: a route rendered `<meta name="robots">`
// inside a Helmet, Helmet appended it rather than replacing the tag already in
// index.html, and the Boss document served two conflicting directives at once —
// `index, follow` from the artifact and `noindex, nofollow` from the route.
// Runtime behaviour is covered end to end in tests/boss/boss-shell.spec.ts;
// this test guards the declaration itself, which is where the duplication came
// from and where it would come from again.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROBOTS_SELECTOR, applyRobotsDirective } from './useRobotsDirective.js';

const appDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceDirectory = path.join(appDirectory, 'src');

const sourceFiles = (directory) => {
  const found = [];
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) found.push(...sourceFiles(full));
    else if (/\.(js|jsx)$/.test(entry) && !entry.endsWith('.test.js')) found.push(full);
  }
  return found;
};

// Prose explaining the rule mentions the tag, so comments are removed before
// the scan: the question is what the code renders, not what it documents.
const withoutComments = (contents) =>
  contents.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const declaresRobotsMeta = (contents) =>
  /<meta\s[^>]*name=["']robots["']/i.test(withoutComments(contents));

test('index.html declares exactly one robots directive', () => {
  const html = readFileSync(path.join(appDirectory, 'index.html'), 'utf8');
  const matches = html.match(/<meta\s[^>]*name=["']robots["'][^>]*>/gi) ?? [];
  assert.equal(matches.length, 1, `expected one robots meta in index.html, found ${matches.length}`);
});

test('no component declares a second robots directive', () => {
  const offenders = sourceFiles(sourceDirectory).filter((file) =>
    declaresRobotsMeta(readFileSync(file, 'utf8')),
  );

  assert.deepEqual(
    offenders.map((file) => path.relative(appDirectory, file)),
    [],
    'A component rendering <meta name="robots"> appends a tag rather than replacing the one in index.html. Use useRobotsDirective instead.',
  );
});

test('the robots owner targets the tag the build ships', () => {
  const html = readFileSync(path.join(appDirectory, 'index.html'), 'utf8');

  assert.equal(ROBOTS_SELECTOR, 'meta[name="robots"]');
  // The selector must actually match the shipped markup, not a shape of it.
  assert.match(html, /<meta\s+name="robots"/);
});

// A minimal stand-in for the one element the owner is allowed to touch. The
// point of these tests is the ownership contract — one tag, rewritten and put
// back — which does not need a DOM implementation to state.
const fakeHead = (attributes) => {
  const meta = {
    attributes: { ...attributes },
    getAttribute: (name) => (name in meta.attributes ? meta.attributes[name] : null),
    setAttribute: (name, value) => {
      meta.attributes[name] = value;
    },
    removeAttribute: (name) => {
      delete meta.attributes[name];
    },
  };
  return {
    meta,
    head: { querySelector: (selector) => (selector === ROBOTS_SELECTOR ? meta : null) },
  };
};

test('applying a directive rewrites the existing tag rather than adding one', () => {
  const { meta, head } = fakeHead({ name: 'robots', content: 'index, follow' });
  applyRobotsDirective(head, 'noindex, nofollow');
  assert.equal(meta.attributes.content, 'noindex, nofollow');
});

test('restoring puts the build value back, whatever it was', () => {
  for (const built of ['index, follow', 'noindex, nofollow']) {
    const { meta, head } = fakeHead({ name: 'robots', content: built });
    const restore = applyRobotsDirective(head, 'noindex, nofollow');
    restore();
    assert.equal(meta.attributes.content, built, `expected ${built} to survive a Boss visit`);
  }
});

test('an artifact with no robots tag is left alone rather than given one', () => {
  const head = { querySelector: () => null };
  assert.equal(applyRobotsDirective(head, 'noindex, nofollow'), undefined);
});
