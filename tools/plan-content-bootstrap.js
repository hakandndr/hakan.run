#!/usr/bin/env node
// Plan a fresh production export against explicit read-only target evidence.
// See docs/OPERATIONS.md for the evidence contract and execution boundary.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { planProductionContent, productionContentSql, targetInspectionSql } from './production-content-plan.js';

let values;
try {
  ({ values } = parseArgs({ options: { input: { type: 'string' }, 'target-state': { type: 'string' },
    'target-database-id': { type: 'string' }, supplement: { type: 'string' },
    sql: { type: 'boolean' }, 'sql-only': { type: 'boolean' },
    json: { type: 'boolean' }, 'target-query': { type: 'boolean' } }, strict: true }));
  if (values['target-query']) {
    if (Object.keys(values).length !== 1) throw new Error('--target-query cannot be combined with planning options');
    process.stdout.write(targetInspectionSql + '\n');
  } else {
    if (!values.input || !values['target-state'] || !values['target-database-id'] || !values.supplement)
      throw new Error('usage: plan-content-bootstrap.js --input <export.csv|json> --target-state <checked-target.json> --target-database-id <verified-id> --supplement <approved-schema-gap.json> [--sql|--sql-only|--json]');
    if ([values.sql, values['sql-only'], values.json].filter(Boolean).length > 1) throw new Error('Choose one output mode');
    // Refuse known staging IDs even if the supplied evidence is mislabeled.
    const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
    if (config.env.staging.d1_databases.some(db => db.database_id === values['target-database-id']))
      throw new Error('A staging database cannot be a production migration target');
    const result = planProductionContent({ bytes: readFileSync(values.input),
      format: path.extname(values.input).slice(1).toLowerCase(),
      target: JSON.parse(readFileSync(values['target-state'], 'utf8')),
      databaseId: values['target-database-id'],
      supplementBytes: readFileSync(values.supplement),
      publicDirectory: fileURLToPath(new URL('../apps/web/public', import.meta.url)),
    });
    // Complete validation before writing any stdout, especially executable SQL.
    const report = JSON.stringify(result.report, null, 2);
    if (values['sql-only']) {
      process.stderr.write(report + '\n');
      process.stdout.write(productionContentSql(result.statements) + '\n');
    } else if (values.sql) process.stdout.write(report + '\n' + productionContentSql(result.statements) + '\n');
    else process.stdout.write(report + '\n');
  }
} catch (error) {
  process.stderr.write(`NOT READY: ${error.message}\n`);
  process.exitCode = 1;
}
