#!/usr/bin/env node
// Plan a legacy analytics import from a snapshot of the live visitor log.
//
//   node tools/legacy-analytics/plan-legacy-import.js <full-log.txt> --initial
//   node tools/legacy-analytics/plan-legacy-import.js <full-log.txt> --initial --sql
//   node tools/legacy-analytics/plan-legacy-import.js <full-log.txt> --initial --sql-only
//   node tools/legacy-analytics/plan-legacy-import.js <full-log.txt> --initial --json
//
// The export is production data and is never committed: the path is an
// argument, and the tool reads whatever file it is given. A fresher export
// must pass prefix verification for subsequent imports, because the log is still being
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
import { parseArgs } from 'node:util';
import { EXCLUSION_REASONS } from './map.js';
import { planLegacyExport } from './plan.js';
import { importStatements, importSql } from './statements.js';

const fail = (message, code = 2) => {
  process.stderr.write(`${message}\n`);
  process.exit(code);
};
let values, paths;
try {
  ({ values, positionals: paths } = parseArgs({ allowPositionals: true, strict: true,
    options: { sql: { type: 'boolean' }, 'sql-only': { type: 'boolean' }, json: { type: 'boolean' },
      initial: { type: 'boolean' }, 'previous-snapshot': { type: 'string' } } }));
} catch (error) { fail(`unknown option or invalid arguments: ${error.message}`); }
if (paths.length !== 1) fail('usage: plan-legacy-import.js <full-log.txt> (--initial|--previous-snapshot <evidence.json>) [--sql|--sql-only|--json]');
if (Boolean(values.initial) === Boolean(values['previous-snapshot'])) fail('Choose exactly one of --initial or --previous-snapshot');
if ([values.sql, values['sql-only'], values.json].filter(Boolean).length > 1) fail('Choose one output mode');
const flags = Object.keys(values).filter(k => values[k] === true).map(k => `--${k}`);

const [exportPath] = paths;
if (!existsSync(exportPath) || !statSync(exportPath).isFile()) {
  fail(`export not found: ${exportPath}`, 1);
}

const sqlOnly = flags.includes('--sql-only');
const asJson = flags.includes('--json');
const withSql = sqlOnly || flags.includes('--sql');
const note = (line) => (sqlOnly || asJson ? process.stderr : process.stdout).write(`${line}\n`);

// Read once, as bytes, so the fingerprint is of exactly what was parsed.
let mapped, summary, snapshot, reconciliation;
const capturedAt = Date.now();
try {
  const bytes = readFileSync(exportPath);
  const evidence = values['previous-snapshot'] ? JSON.parse(readFileSync(values['previous-snapshot'], 'utf8')) : null;
  const previous = evidence?.snapshot
    ? { ...evidence.snapshot, classification: evidence.snapshot.classification ?? evidence.classification }
    : evidence;
  ({ mapped, summary, snapshot, reconciliation } = planLegacyExport({ bytes,
    previous, initial: values.initial === true,
    fileName: path.basename(exportPath), capturedAt }));
} catch (error) { fail(`NOT READY: ${error.message}`, 1); }

const iso = (at) => (at === null ? '-' : new Date(at).toISOString());

note(`mode                ${reconciliation.mode}`);
note(`old prefix          ${reconciliation.previous.byteSize} bytes sha256:${reconciliation.previous.fingerprint}`);
note(`new full log        ${reconciliation.full.byteSize} bytes sha256:${reconciliation.full.fingerprint}`);
note(`previous totals     ${JSON.stringify({ sourceRecords: reconciliation.previous.sourceRecords, importableEvents: reconciliation.previous.importableEvents, archivedOnly: reconciliation.previous.archivedOnly, archiveRows: reconciliation.previous.archiveRows })}`);
note(`delta               ${JSON.stringify(reconciliation.delta)}`);
note(`archive rows        ${reconciliation.full.archiveRows} (includes PAGE provenance)`);
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
const initialSqlOptions = { requireEmptyTarget: reconciliation.mode === 'initial' };
note(`statements          ${importStatements(mapped, snapshot, initialSqlOptions).length}`);
note('coverage ledger     untouched — imported history is raw and uncovered');
note('');
note('This snapshot is a cutoff, not a completion: the source log is still being');
note('written to. Supply its verified snapshot evidence with the next full export.');
note('Delta counts describe source growth, not confirmation of database writes.');

const unaccounted = summary.imported + summary.archived - summary.sourceRecords;
if (unaccounted !== 0) {
  process.stderr.write(`\nNOT READY: ${unaccounted} source records are unaccounted for\n`);
  process.exit(1);
}

if (asJson) {
  process.stdout.write(`${JSON.stringify({ snapshot, summary, reconciliation }, null, 2)}\n`);
}

if (withSql) {
  if (!sqlOnly) process.stdout.write('\n');
  process.stdout.write(`${importSql(mapped, snapshot, initialSqlOptions)}\n`);
}
