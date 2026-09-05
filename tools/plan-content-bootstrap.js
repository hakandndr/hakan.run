#!/usr/bin/env node
// Produce and review the staging content bootstrap plan. Writes nothing.
//
//   node tools/plan-content-bootstrap.js              summary only
//   node tools/plan-content-bootstrap.js --sql        summary, then the SQL
//   node tools/plan-content-bootstrap.js --sql-only   the SQL, and nothing else
//
// `--sql-only` exists so the output can be piped straight into a database
// client. Everything human — the summary, the provenance table, the asset list,
// and any validation failure — goes to stderr in that mode, so stdout is
// executable SQL from its first byte and a redirect cannot silently capture
// prose as if it were statements.
//
// An unrecognised flag is refused rather than ignored. Falling through to the
// default mode is exactly how a mistyped `--sql-only` ends up writing a summary
// into a file named `bootstrap.sql`, and the mistake is invisible until someone
// feeds it to a database.
//
// This composes the dataset from its two declared sources, applies the
// exclusions and transforms, and runs every validation. It does not connect to
// anything: producing the plan and executing it are separate acts, and only the
// first one lives in this repository.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toModuleUrl } from './module-url.js';
import {
  readSnapshotCsv,
  composeDataset,
  validateDataset,
  datasetRows,
  assetReferences,
  planBootstrap,
  bootstrapStatements,
  bootstrapSql,
} from './content-bootstrap.js';

export const KNOWN_FLAGS = ['--sql', '--sql-only'];

const flags = process.argv.slice(2);
const unknown = flags.filter((flag) => !KNOWN_FLAGS.includes(flag));
if (unknown.length > 0) {
  process.stderr.write(
    `unknown option${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}\n` +
      `known options: ${KNOWN_FLAGS.join(', ')}\n`,
  );
  process.exit(2);
}

const sqlOnly = flags.includes('--sql-only');
const withSql = sqlOnly || flags.includes('--sql');

// In --sql-only, stdout carries SQL and only SQL. Everything else is stderr.
const report = (line) => process.stderr.write(`${line}\n`);
const note = (line) => (sqlOnly ? report(line) : process.stdout.write(`${line}\n`));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshotPath = path.join(root, 'tools/snapshots/production-site-content.csv');
const publicDirectory = path.join(root, 'apps/web/public');

// `import()` takes a URL. A bare path works on POSIX and fails on Windows.
const { siteContent } = await import(toModuleUrl(path.join(root, 'apps/web/src/content.js')));
const snapshot = readSnapshotCsv(readFileSync(snapshotPath, 'utf8'));
const dataset = composeDataset({ snapshot, fallback: siteContent });

note(`snapshot rows      ${snapshot.length}`);
note(`composed sections  ${Object.keys(dataset.sections).length}`);
for (const [section, source] of Object.entries(dataset.provenance)) {
  const bytes = JSON.stringify(dataset.sections[section]).length;
  note(`  ${section.padEnd(11)} ${source.padEnd(11)} ${String(bytes).padStart(5)} bytes`);
}
for (const { path: field, value } of dataset.excluded) note(`excluded           ${field} = ${value}`);
for (const rule of dataset.transformed) note(`transformed        ${rule.path}: ${rule.from} -> ${rule.to}`);
for (const { asset, paths } of assetReferences(dataset.sections)) {
  note(`asset              ${asset}  (${paths.join(', ')})`);
}

const problems = validateDataset(dataset, publicDirectory);
if (problems.length > 0) {
  // Always stderr, in every mode: a failure must never reach a file that is
  // about to be executed, and must never be mistaken for an empty plan.
  report('\nNOT READY:');
  for (const problem of problems) report(`  - ${problem}`);
  report('\nNo plan produced. Resolve the above, then run this again.');
  process.exit(1);
}

// An empty existing state: this prints the plan for a first run. Planning
// against live staging rows happens at execution time, against the real database.
const plan = planBootstrap(datasetRows(dataset), [], Date.now());
note(`\nplan               ${JSON.stringify(plan.summary)}`);
note(`statements         ${bootstrapStatements(plan).length}`);

if (withSql) {
  if (!sqlOnly) process.stdout.write('\n');
  process.stdout.write(`${bootstrapSql(plan)}\n`);
}
