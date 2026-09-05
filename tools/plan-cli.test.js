// The planner's command-line contract, exercised by running it.
//
// These spawn the real script and read its real streams. Testing the helper
// functions would not have caught what this file exists for: `--sql-only`
// producing a human summary because the flag was never wired into argument
// parsing. Output-mode bugs live in the wiring, not in the helpers, and are
// only visible from outside the process.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const script = path.join(here, 'plan-content-bootstrap.js');

const run = (args = [], cwd = root) =>
  spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });

const FIRST_STATEMENT = 'INSERT INTO content_revisions';

// --- --sql-only: stdout is SQL, from the first byte ---------------------------

test('--sql-only writes SQL and nothing else to stdout', () => {
  const result = run(['--sql-only']);
  assert.equal(result.status, 0, result.stderr);

  const lines = result.stdout.split('\n').filter((line) => line.trim().length > 0);
  assert.ok(lines[0].startsWith(FIRST_STATEMENT), `first line was: ${lines[0]}`);
});

test('--sql-only emits exactly the 36 statements of the current plan', () => {
  const { stdout } = run(['--sql-only']);
  assert.equal((stdout.match(/^INSERT INTO/gm) ?? []).length, 36);
  assert.equal((stdout.match(/^INSERT INTO content_revisions/gm) ?? []).length, 12);
  assert.equal((stdout.match(/^INSERT INTO content_sections/gm) ?? []).length, 12);
  assert.equal((stdout.match(/^INSERT INTO audit_events/gm) ?? []).length, 12);
});

test('no summary, prose or asset line reaches stdout', () => {
  const { stdout } = run(['--sql-only']);
  // Deliberately not on this list: `excluded`, which appears 48 times as the
  // SQL keyword in `ON CONFLICT DO UPDATE SET x = excluded.x`, and `production`,
  // which appears in the revision note and the audit detail. Both are content,
  // not prose leaking from the summary; a forbidden-word list has to know the
  // difference or it starts forbidding the output it is protecting.
  for (const forbidden of [
    'snapshot rows',
    'composed sections',
    'asset',
    'plan',
    'statements',
    'transformed',
    'NOT READY',
  ]) {
    assert.ok(
      !stdout.toLowerCase().includes(forbidden.toLowerCase()),
      `stdout must not contain "${forbidden}"`,
    );
  }
});

test('nothing excluded or rewritten survives into the SQL', () => {
  const { stdout } = run(['--sql-only']);
  for (const forbidden of ['formspree', 'supabase', 'https://hakan.run']) {
    assert.ok(!stdout.toLowerCase().includes(forbidden), `stdout must not contain ${forbidden}`);
  }
});

test('the human output is still produced, on stderr', () => {
  const { stderr } = run(['--sql-only']);
  assert.match(stderr, /snapshot rows\s+10/);
  assert.match(stderr, /composed sections\s+12/);
  assert.match(stderr, /statements\s+36/);
  // Diagnostics are not lost by redirecting stdout; they move.
  assert.ok(stderr.includes('asset'));
});

// --- The mode it must not fall through to ------------------------------------

test('--sql keeps its summary on stdout, unchanged', () => {
  const { status, stdout } = run(['--sql']);
  assert.equal(status, 0);
  assert.match(stdout, /snapshot rows\s+10/);
  assert.ok(stdout.includes(FIRST_STATEMENT));
  assert.equal((stdout.match(/^INSERT INTO/gm) ?? []).length, 36);
});

test('the default mode prints the summary and no SQL', () => {
  const { status, stdout } = run([]);
  assert.equal(status, 0);
  assert.match(stdout, /composed sections\s+12/);
  assert.ok(!stdout.includes(FIRST_STATEMENT));
});

// --- A flag that is not a flag ------------------------------------------------

test('an unrecognised option is refused rather than silently ignored', () => {
  // This is the failure that motivated the file: a near-miss flag falling
  // through to the default mode writes a summary into bootstrap.sql, and
  // nothing says so until it reaches a database.
  const result = run(['--sqlonly']);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '', 'a refused invocation must write nothing to stdout');
  assert.match(result.stderr, /unknown option/);
  assert.match(result.stderr, /--sql-only/);
});

// --- A validation failure must not contaminate stdout -------------------------

test('a missing asset exits nonzero, with diagnostics on stderr and no SQL', () => {
  // A fixture tree with one portfolio image withheld. The script resolves its
  // inputs from its own location, so the tree is a real copy rather than a
  // symlink farm — Node resolves module symlinks and would find the real
  // repository instead.
  const fixture = mkdtempSync(path.join(os.tmpdir(), 'bootstrap-cli-'));
  try {
    cpSync(path.join(root, 'tools'), path.join(fixture, 'tools'), {
      recursive: true,
      filter: (source) => !source.endsWith('.test.js'),
    });
    cpSync(
      path.join(root, 'worker/lib/content-sections.js'),
      path.join(fixture, 'worker/lib/content-sections.js'),
    );
    cpSync(
      path.join(root, 'apps/web/src/content.js'),
      path.join(fixture, 'apps/web/src/content.js'),
    );
    cpSync(path.join(root, 'apps/web/public'), path.join(fixture, 'apps/web/public'), {
      recursive: true,
      filter: (source) => !source.endsWith('dndr-labs.webp'),
    });

    const result = spawnSync(
      process.execPath,
      [path.join(fixture, 'tools/plan-content-bootstrap.js'), '--sql-only'],
      { cwd: fixture, encoding: 'utf8' },
    );

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '', 'a failed run must not write a partial or empty SQL file');
    assert.match(result.stderr, /NOT READY/);
    assert.match(result.stderr, /dndr-labs\.webp/);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('the fixture proves the check, not the copy: with every asset present it succeeds', () => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), 'bootstrap-cli-ok-'));
  try {
    cpSync(path.join(root, 'tools'), path.join(fixture, 'tools'), {
      recursive: true,
      filter: (source) => !source.endsWith('.test.js'),
    });
    cpSync(
      path.join(root, 'worker/lib/content-sections.js'),
      path.join(fixture, 'worker/lib/content-sections.js'),
    );
    cpSync(path.join(root, 'apps/web/src/content.js'), path.join(fixture, 'apps/web/src/content.js'));
    cpSync(path.join(root, 'apps/web/public'), path.join(fixture, 'apps/web/public'), { recursive: true });

    const result = spawnSync(
      process.execPath,
      [path.join(fixture, 'tools/plan-content-bootstrap.js'), '--sql-only'],
      { cwd: fixture, encoding: 'utf8' },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.equal((result.stdout.match(/^INSERT INTO/gm) ?? []).length, 36);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
