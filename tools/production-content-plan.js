// Offline first-publication planner. Evidence is supplied, never fetched.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { siteContent } from '../apps/web/src/content.js';
import { validateSection } from '../apps/web/src/content-source/schema.js';
import { readSnapshot, readSnapshotCsv, parseCsv, composeDataset, validateDataset, datasetRows,
  planBootstrap, bootstrapStatements, SnapshotError } from './content-bootstrap.js';

const migration = readFileSync(new URL('../migrations/app/0001_init.sql', import.meta.url), 'utf8');
const normalizeSql = (sql) => sql.replace(/\s+/g, '').replace(/;$/, '').toLowerCase();
const definitions = [...migration.replace(/^\s*--.*$/gm, '').matchAll(/CREATE (TABLE|INDEX)\s+(\w+)[\s\S]*?;/g)]
  .map(([sql, type, name]) => ({ type: type.toLowerCase(), name, sql }));
export const TARGET_TABLES = definitions.filter(o => o.type === 'table').map(o => o.name);
export const targetInspectionSql = `SELECT name, type, sql FROM sqlite_master
WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name != 'd1_migrations'
ORDER BY name;
${TARGET_TABLES.map(name => `SELECT '${name}' AS name, COUNT(*) AS count FROM ${name};`).join('\n')}`;
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

export const validateTargetState = (state, databaseId, now = Date.now()) => {
  if (!state || state.contract !== 1 || state.environment !== 'production'
    || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(databaseId ?? '')
    || state.databaseId !== databaseId) throw new SnapshotError('Explicit production target identity does not match evidence');
  const checkedAt = Date.parse(state.checkedAt);
  if (!Number.isFinite(checkedAt) || checkedAt > now || now - checkedAt > 86400000)
    throw new SnapshotError('Target evidence must be checked within the last 24 hours');
  if (!Array.isArray(state.schema) || state.schema.length !== definitions.length)
    throw new SnapshotError('Target schema is incompatible');
  for (const expected of definitions) {
    const matches = state.schema.filter(o => o.name === expected.name && o.type === expected.type);
    if (matches.length !== 1 || typeof matches[0].sql !== 'string'
      || normalizeSql(matches[0].sql) !== normalizeSql(expected.sql))
      throw new SnapshotError(`Target schema is incompatible: ${expected.name}`);
  }
  for (const table of TARGET_TABLES) {
    if (state.counts?.[table] !== 0) throw new SnapshotError(`Target must be empty: ${table}`);
  }
  return state;
};

export const planProductionContent = ({ bytes, format, target, databaseId, publicDirectory, now = Date.now() }) => {
  validateTargetState(target, databaseId, now);
  const raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  let rows;
  if (format === 'csv') {
    const header = parseCsv(raw)[0];
    if (header?.length !== 2 || !header.includes('section') || !header.includes('data'))
      throw new SnapshotError('CSV must contain only section and data columns');
    rows = readSnapshotCsv(raw);
  }
  else if (format === 'json') {
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.some(row => !row || Object.keys(row).some(k => !['section', 'data'].includes(k))))
      throw new SnapshotError('Export rows must contain only section and data, never staging state');
    rows = readSnapshot(data);
  } else throw new SnapshotError('Input must be a .csv or .json production export');
  // Only these two sections may be promoted from the approved source fallback.
  const dataset = composeDataset({ snapshot: rows, fallback: {
    typography: siteContent.typography, visibility: siteContent.visibility,
  } });
  const nav = dataset.sections.header.navLinks;
  const order = ['/#services', '/#portfolio', '/#about'];
  if (!Array.isArray(nav) || nav.length !== order.length
    || order.some(href => nav.filter(link => link?.href === href).length !== 1))
    throw new SnapshotError('Header navigation differs from the approved three destinations; review required');
  dataset.sections.header.navLinks = order.map(href => nav.find(link => link.href === href));
  const problems = validateDataset(dataset, publicDirectory);
  for (const [section, data] of Object.entries(dataset.sections)) {
    problems.push(...validateSection(section, data).map(error => `${section}: ${JSON.stringify(error)}`));
  }
  if (problems.length) throw new SnapshotError(problems.join('\n'));
  const plan = planBootstrap(datasetRows(dataset), [], now);
  // First publication only: never emit an upsert, even if evidence becomes stale.
  const statements = bootstrapStatements(plan).map(statement => ({ ...statement,
    sql: statement.sql.replace(/\s+ON CONFLICT \(section\) DO UPDATE SET[\s\S]*$/, ''),
  }));
  const empty = TARGET_TABLES.map(table => `(SELECT COUNT(*) FROM ${table}) = 0`).join(' AND ');
  statements.unshift({ sql: `SELECT CASE WHEN ${empty} THEN 1 ELSE json('target_not_empty') END`, params: [] });
  return { dataset, statements, report: { databaseId, checkedAt: target.checkedAt,
    input: { byteSize: bytes.length, fingerprint: digest(bytes) },
    targetEvidenceFingerprint: digest(Buffer.from(JSON.stringify(target))),
    sections: Object.keys(dataset.sections), provenance: dataset.provenance,
    excluded: dataset.excluded.map(e => e.path), transformed: dataset.transformed,
    headerOrder: dataset.sections.header.navLinks.map(link => link.name), plan: plan.summary } };
};

export const productionContentSql = (statements) => statements.map(({ sql, params }) => {
  let i = 0;
  return sql.replace(/\?/g, () => { const value = params[i++];
    return value === null ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`; }) + ';';
}).join('\n\n');
