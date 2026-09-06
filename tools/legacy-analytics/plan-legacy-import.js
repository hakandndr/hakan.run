#!/usr/bin/env node
// Plan a legacy analytics import from a snapshot of the live visitor log.
//
//   node tools/legacy-analytics/plan-legacy-import.js <export.txt>
//   node tools/legacy-analytics/plan-legacy-import.js <export.txt> --sql
//   node tools/legacy-analytics/plan-legacy-import.js <export.txt> --sql-only
//   node tools/legacy-analytics/plan-legacy-import.js <export.txt> --json
//
// The export is production data and is never committed: the path is an
// argument, and the tool reads whatever file it is given. A fresher export
// needs no code change — that is the point, because the log is still being
// written to and any snapshot is a cutoff rather than a completion.
//
// Every number below is recomputed from the supplied file on every run. None is
// carried forward from an earlier export, and none is compiled in. A count that
// outlives the bytes it was measured from is a claim about data nobody has read.
//
// In --sql-only mode stdout carries SQL and only SQL, and every human line —
// including a failure — goes to stderr, so a redirect captures statements and
// never prose.

import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseExport } from './parse.js';
import { mapExport, summarize, EXCLUSION_REASONS } from './map.js';
import { describeSnapshot } from './snapshot.js';
import { importStatements, importSql } from './statements.js';

const KNOWN_FLAGS = ['--sql', '--sql-only', '--json'];
const args = process.argv.slice(2);
const flags = args.filter((arg) => arg.startsWith('--'));
const paths = args.filter((arg) => !arg.startsWith('--'));

const fail = (message, code = 2) => {
  process.stderr.write(`${message}\n`);
  process.exit(code);
};

const unknown = flags.filter((flag) => !KNOWN_FLAGS.includes(flag));
if (unknown.length > 0) {
  fail(`unknown option${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}\nknown options: ${KNOWN_FLAGS.join(', ')}`);
}
if (paths.length !== 1) {
  fail('usage: plan-legacy-import.js <export.txt> [--sql|--sql-only|--json]');
}

const [exportPath] = paths;
if (!existsSync(exportPath) || !statSync(exportPath).isFile()) {
  fail(`export not found: ${exportPath}`, 1);
}

const sqlOnly = flags.includes('--sql-only');
const asJson = flags.includes('--json');
const withSql = sqlOnly || flags.includes('--sql');
const note = (line) => (sqlOnly || asJson ? process.stderr : process.stdout).write(`${line}\n`);

// Read once, as bytes, so the fingerprint is of exactly what was parsed.
const bytes = readFileSync(exportPath);
const capturedAt = Date.now();
const mapped = mapExport(parseExport(bytes.toString('utf8')), capturedAt);
const summary = summarize(mapped);
const snapshot = describeSnapshot({
  contents: bytes,
  fileName: path.basename(exportPath),
  mapped,
  capturedAt,
});

const iso = (at) => (at === null ? '-' : new Date(at).toISOString());

note(`snapshot            ${snapshot.id}`);
note(`  fingerprint       sha256:${snapshot.fingerprint}`);
note(`  file              ${snapshot.fileName} (${snapshot.byteSize} bytes)`);
note(`  read at           ${new Date(capturedAt).toISOString()}`);
note('');
note('reconciliation — recomputed from this file, valid for this snapshot only');
note(`  source records    ${summary.sourceRecords}`);
note(`  panel-visible     ${summary.panelVisible}   (the old panel drops the earliest format)`);
note(`  path-bearing      ${summary.pathBearing}`);
note(`  importable PAGE   ${summary.imported}`);
note(`  archived          ${summary.archived}`);
note(`  malformed         ${summary.malformed}`);
note('');
note('source fidelity');
note(`  duplicate rows    ${summary.duplicateRecords}   (double-writes, preserved not collapsed)`);
note(`  distinct records  ${summary.distinctRecords}`);
note('');
note('formats');
for (const [format, count] of Object.entries(summary.formats).sort()) {
  note(`  ${format.padEnd(14)}    ${count}`);
}
note('');
note('archive reasons');
for (const reason of EXCLUSION_REASONS) {
  note(`  ${reason.padEnd(18)}${summary.reasons[reason]}`);
}
note('');
note('timestamps (America/Los_Angeles wall clock in the source)');
note(`  earliest record   ${iso(summary.earliestAt)}`);
note(`  latest record     ${iso(summary.latestAt)}`);
note(`  import cutoff     ${iso(snapshot.latestEventAt)}   <- newest event this snapshot carries`);
note('');
note(`statements          ${importStatements(mapped, snapshot).length}`);
note('coverage ledger     untouched — imported history is raw and uncovered');
note('');
note('This snapshot is a cutoff, not a completion: the source log is still being');
note('written to. A later export re-run through this tool adds only what was');
note('appended since, because every id is derived from content and source line.');

const unaccounted = summary.imported + summary.archived - summary.sourceRecords;
if (unaccounted !== 0) {
  process.stderr.write(`\nNOT READY: ${unaccounted} source records are unaccounted for\n`);
  process.exit(1);
}

if (asJson) {
  process.stdout.write(`${JSON.stringify({ snapshot, summary }, null, 2)}\n`);
}

if (withSql) {
  if (!sqlOnly) process.stdout.write('\n');
  process.stdout.write(`${importSql(mapped, snapshot)}\n`);
}
