// The planner's command line, exercised by running it.
//
// The point of this file is the part that cannot be seen from inside the
// process: that the tool takes an arbitrary path, that a fresh export needs no
// code change, that stdout in --sql-only mode is SQL from its first byte, and
// that nothing about the counts is compiled in.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, 'plan-legacy-import.js');
const fixturePath = path.join(here, 'fixtures/sample-panel-log.txt');

const run = (args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

const tempExport = (contents) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'legacy-export-'));
  const file = path.join(dir, 'panel_log.txt');
  writeFileSync(file, contents);
  return { dir, file };
};

// --- Arbitrary file paths ---------------------------------------------------

test('the export is an argument, so a fresh snapshot needs no code change', () => {
  const { dir, file } = tempExport(readFileSync(fixturePath, 'utf8'));
  try {
    const result = run([file]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /source records\s+13/);
    assert.match(result.stdout, /panel_log\.txt/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a missing file is refused with a message, not a stack trace', () => {
  const result = run(['/nonexistent/panel_log.txt']);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /export not found/);
});

test('no path, or more than one, is a usage error', () => {
  assert.equal(run([]).status, 2);
  assert.match(run([]).stderr, /usage/);
  assert.equal(run([fixturePath, fixturePath]).status, 2);
});

test('an unrecognised option is refused rather than silently ignored', () => {
  const result = run([fixturePath, '--sqlonly']);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /unknown option/);
});

// --- Counts are recomputed, never remembered --------------------------------

test('the counts come from the file supplied, not from any earlier export', () => {
  const source = readFileSync(fixturePath, 'utf8');
  const trimmed = source.split('\n').filter((l) => l.trim()).slice(0, 5).join('\n');
  const { dir, file } = tempExport(`${trimmed}\n`);
  try {
    const result = run([file]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /source records\s+5/, 'a shorter file must report a smaller total');
    assert.ok(!/source records\s+13/.test(result.stdout));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a different file produces a different snapshot fingerprint', () => {
  const a = tempExport('198.51.100.1 | 2026-01-01 00:00:00 | France | Paris, IDF | Desktop / Chrome 100\n');
  const b = tempExport('198.51.100.2 | 2026-01-01 00:00:00 | France | Paris, IDF | Desktop / Chrome 100\n');
  try {
    const fa = /fingerprint\s+sha256:(\w+)/.exec(run([a.file]).stdout)[1];
    const fb = /fingerprint\s+sha256:(\w+)/.exec(run([b.file]).stdout)[1];
    assert.notEqual(fa, fb);
    assert.equal(fa.length, 64);
  } finally {
    rmSync(a.dir, { recursive: true, force: true });
    rmSync(b.dir, { recursive: true, force: true });
  }
});

test('the same bytes under a different name are the same snapshot', () => {
  const contents = readFileSync(fixturePath, 'utf8');
  const a = tempExport(contents);
  const b = tempExport(contents);
  try {
    assert.equal(
      /fingerprint\s+sha256:(\w+)/.exec(run([a.file]).stdout)[1],
      /fingerprint\s+sha256:(\w+)/.exec(run([b.file]).stdout)[1],
    );
  } finally {
    rmSync(a.dir, { recursive: true, force: true });
    rmSync(b.dir, { recursive: true, force: true });
  }
});

// --- What the report must always say ----------------------------------------

test('all three reconciliation totals are reported together', () => {
  const { stdout } = run([fixturePath]);
  for (const label of ['source records', 'panel-visible', 'path-bearing', 'importable PAGE', 'archived', 'malformed']) {
    assert.match(stdout, new RegExp(label), `the report must state "${label}"`);
  }
});

test('every archive reason is reported, including the ones at zero', () => {
  const { stdout } = run([fixturePath]);
  for (const reason of ['malformed_record', 'missing_timestamp', 'invalid_ip', 'missing_path', 'non_public_path']) {
    assert.match(stdout, new RegExp(reason), `the report must state ${reason}`);
  }
});

test('the cutoff is stated, and stated as a cutoff', () => {
  const { stdout } = run([fixturePath]);
  assert.match(stdout, /import cutoff/);
  assert.match(stdout, /cutoff, not a completion/);
});

test('duplicate and distinct source counts are both reported', () => {
  const { stdout } = run([fixturePath]);
  assert.match(stdout, /duplicate rows\s+1/);
  assert.match(stdout, /distinct records\s+12/);
});

// --- Output modes -----------------------------------------------------------

test('--sql-only writes SQL and nothing else to stdout', () => {
  const result = run([fixturePath, '--sql-only']);
  assert.equal(result.status, 0, result.stderr);
  const [first] = result.stdout.split('\n').filter((line) => line.trim());
  assert.ok(first.startsWith('INSERT OR IGNORE INTO legacy_import_snapshots'), first);
  for (const prose of ['source records', 'panel-visible', 'archive reasons', 'cutoff']) {
    assert.ok(!result.stdout.includes(prose), `stdout must not contain "${prose}"`);
  }
  assert.match(result.stderr, /source records/, 'the human report moves to stderr rather than vanishing');
});

test('--json emits a machine-readable plan with the snapshot inside it', () => {
  const result = run([fixturePath, '--json']);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.summary.sourceRecords, 13);
  assert.equal(payload.snapshot.fingerprint.length, 64);
  assert.equal(payload.snapshot.importedEvents + payload.snapshot.archivedRecords, payload.summary.sourceRecords);
});

test('no tracking token reaches the generated SQL', () => {
  const { stdout } = run([fixturePath, '--sql-only']);
  assert.ok(!/fbclid/i.test(stdout));
  assert.ok(!/EXAMPLE_TRACKING_TOKEN/i.test(stdout));
  assert.ok(!/l\.instagram\.com/.test(stdout));
});

test('the generated SQL touches only the three legacy tables', () => {
  const { stdout } = run([fixturePath, '--sql-only']);
  const tables = new Set([...stdout.matchAll(/INSERT OR IGNORE INTO (\w+)/g)].map((m) => m[1]));
  assert.deepEqual([...tables].sort(), ['legacy_analytics_records', 'legacy_import_snapshots', 'visitor_events']);
  assert.ok(!/analytics_coverage|analytics_daily/i.test(stdout));
});
