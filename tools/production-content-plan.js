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

export const SCHEMA_GAP_SUPPLEMENT_PATHS = [
  'hero.primaryButtonHref',
  'hero.secondaryButtonHref',
  'about.block1.sections[0].period',
  'about.block1.sections[1].period',
  'about.chips',
  'portfolio.cards[0].technology',
  'portfolio.cards[1].technology',
  'portfolio.cards[2].technology',
  'portfolio.cards[3].technology',
  'cta.buttonHref',
  'footer.bottomSignature',
  'footer.bottomLocation',
];

export const SCHEMA_GAP_SUPPLEMENT_SOURCE = {
  environment: 'staging',
  databaseName: 'hakan-run-app-staging',
  databaseId: '71a28b10-861f-4554-9e14-5464c7116394',
  evidenceSha256: '177bd86a7d8c27ac851060b608c6f6e6909dfc1c31841cd6ddddf67544bc64da',
  publishedRevisions: { hero: 6, about: 2, portfolio: 2, cta: 2, footer: 2 },
};

const clone = value => JSON.parse(JSON.stringify(value));
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, expected) => isRecord(value)
  && Object.keys(value).sort().join('\0') === [...expected].sort().join('\0');
const pathSegments = path => path.match(/[^.[\]]+/g) ?? [];
const ownPath = (root, segments) => {
  let node = root;
  for (const segment of segments) {
    if ((node === null || typeof node !== 'object')
      || !Object.prototype.hasOwnProperty.call(node, segment)) return false;
    node = node[segment];
  }
  return true;
};
const setMissingPath = (root, segments, value) => {
  const last = segments.at(-1);
  const parent = segments.slice(0, -1).reduce((node, segment) => {
    if ((node === null || typeof node !== 'object')
      || !Object.prototype.hasOwnProperty.call(node, segment)) {
      throw new SnapshotError(`Supplement parent path is missing: ${segments.join('.')}`);
    }
    return node[segment];
  }, root);
  if (Object.prototype.hasOwnProperty.call(parent, last)) {
    throw new SnapshotError(`Supplement may not overwrite an existing value: ${segments.join('.')}`);
  }
  parent[last] = clone(value);
};

const validateSupplementSource = source => {
  if (!exactKeys(source, ['environment', 'databaseName', 'databaseId', 'evidenceSha256', 'publishedRevisions']))
    throw new SnapshotError('Supplement source metadata is malformed');
  for (const key of ['environment', 'databaseName', 'databaseId', 'evidenceSha256']) {
    if (source[key] !== SCHEMA_GAP_SUPPLEMENT_SOURCE[key])
      throw new SnapshotError(`Supplement source ${key} does not match the approved evidence`);
  }
  const revisions = SCHEMA_GAP_SUPPLEMENT_SOURCE.publishedRevisions;
  if (!exactKeys(source.publishedRevisions, Object.keys(revisions)))
    throw new SnapshotError('Supplement published revisions are malformed');
  for (const [section, revision] of Object.entries(revisions)) {
    if (source.publishedRevisions[section] !== revision)
      throw new SnapshotError(`Supplement revision for ${section} does not match the approved evidence`);
  }
};

export const readSchemaGapSupplement = bytes => {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0)
    throw new SnapshotError('A schema-gap supplement evidence file is required');
  let supplement;
  try {
    supplement = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new SnapshotError('Supplement must be valid UTF-8 JSON');
  }
  if (!exactKeys(supplement, ['contract', 'purpose', 'source', 'fields'])
    || supplement.contract !== 1 || supplement.purpose !== 'production-content-schema-gap')
    throw new SnapshotError('Supplement contract is malformed');
  validateSupplementSource(supplement.source);
  if (!Array.isArray(supplement.fields)) throw new SnapshotError('Supplement fields must be a list');

  const approved = new Set(SCHEMA_GAP_SUPPLEMENT_PATHS);
  const seen = new Set();
  const values = new Map();
  for (const entry of supplement.fields) {
    if (!exactKeys(entry, ['path', 'value'])) throw new SnapshotError('Supplement field entry is malformed');
    if (typeof entry.path !== 'string'
      || !/^[a-z][a-zA-Z0-9]*(?:(?:\.[a-z][a-zA-Z0-9]*)|(?:\[\d+\]))*$/.test(entry.path))
      throw new SnapshotError('Supplement carries a malformed path');
    if (seen.has(entry.path)) throw new SnapshotError(`Supplement path appears twice: ${entry.path}`);
    seen.add(entry.path);
    if (!approved.has(entry.path)) throw new SnapshotError(`Supplement path is not approved: ${entry.path}`);
    if (entry.value === null || entry.value === undefined
      || (typeof entry.value === 'string' && entry.value.trim() === '')
      || (Array.isArray(entry.value) && entry.value.length === 0))
      throw new SnapshotError(`Supplement value is empty: ${entry.path}`);
    values.set(entry.path, clone(entry.value));
  }
  const missing = SCHEMA_GAP_SUPPLEMENT_PATHS.filter(path => !seen.has(path));
  if (missing.length) throw new SnapshotError(`Supplement is missing approved paths: ${missing.join(', ')}`);

  return {
    source: clone(supplement.source),
    fields: SCHEMA_GAP_SUPPLEMENT_PATHS.map(path => ({ path, value: values.get(path) })),
    input: { byteSize: bytes.length, fingerprint: digest(bytes) },
  };
};

const promotionProvenance = () => [
  ...Object.entries(siteContent.typography).map(([key, value]) => ({
    path: `typography.${key}`, type: 'approved-source-promotion',
    sourceEvidence: 'apps/web/src/content.js', originalState: 'missing', finalValue: clone(value),
  })),
  ...Object.entries(siteContent.visibility).map(([key, value]) => ({
    path: `visibility.${key}`, type: 'approved-source-promotion',
    sourceEvidence: 'apps/web/src/content.js', originalState: 'missing', finalValue: clone(value),
  })),
];

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

export const planProductionContent = ({ bytes, format, target, databaseId, publicDirectory,
  supplementBytes, now = Date.now() }) => {
  validateTargetState(target, databaseId, now);
  const supplement = readSchemaGapSupplement(supplementBytes);
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
  const production = new Map(rows.map(row => [row.section, row.data]));
  const supplementProvenance = [];
  for (const entry of supplement.fields) {
    const segments = pathSegments(entry.path);
    const section = segments[0];
    const source = production.get(section);
    if (!source) throw new SnapshotError(`Supplement section is absent from production: ${section}`);
    if (ownPath(source, segments.slice(1)))
      throw new SnapshotError(`Supplement may not override production content: ${entry.path}`);
    setMissingPath(dataset.sections, segments, entry.value);
    supplementProvenance.push({
      path: entry.path,
      type: 'owner-approved-schema-gap-supplement',
      sourceEvidence: {
        databaseName: supplement.source.databaseName,
        databaseId: supplement.source.databaseId,
        evidenceSha256: supplement.source.evidenceSha256,
        publishedRevision: supplement.source.publishedRevisions[section],
      },
      originalState: 'missing',
      finalValue: clone(entry.value),
    });
  }
  const nav = dataset.sections.header.navLinks;
  const order = ['/#services', '/#portfolio', '/#about'];
  if (!Array.isArray(nav) || nav.length !== order.length
    || order.some(href => nav.filter(link => link?.href === href).length !== 1))
    throw new SnapshotError('Header navigation differs from the approved three destinations; review required');
  const originalHeaderLinks = clone(nav);
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
  const fieldProvenance = [
    ...promotionProvenance(),
    ...supplementProvenance,
    {
      path: 'header.navLinks', type: 'deterministic-normalization',
      sourceEvidence: 'approved-header-order', originalValue: originalHeaderLinks,
      finalValue: clone(dataset.sections.header.navLinks),
    },
    ...dataset.transformed.map(entry => ({
      path: entry.path, type: 'deterministic-normalization', sourceEvidence: 'declared-transform-rule',
      originalValue: entry.from, finalValue: entry.to,
    })),
    ...dataset.excluded.map(entry => ({
      path: entry.path, type: 'deterministic-exclusion', sourceEvidence: 'declared-exclusion-rule',
      originalValue: entry.value, finalState: 'excluded',
    })),
  ];
  return { dataset, statements, report: { databaseId, checkedAt: target.checkedAt,
    input: { byteSize: bytes.length, fingerprint: digest(bytes) },
    targetEvidenceFingerprint: digest(Buffer.from(JSON.stringify(target))),
    sections: Object.keys(dataset.sections), provenance: dataset.provenance,
    sectionProvenance: Object.fromEntries(Object.entries(dataset.provenance).map(([section, source]) =>
      [section, source === 'production' ? 'production-export' : 'approved-source-promotion'])),
    fieldProvenance,
    supplement: { ...supplement.input, source: supplement.source,
      paths: supplement.fields.map(entry => entry.path) },
    excluded: dataset.excluded.map(e => e.path), transformed: dataset.transformed,
    headerOrder: dataset.sections.header.navLinks.map(link => link.name), plan: plan.summary } };
};

export const productionContentSql = (statements) => statements.map(({ sql, params }) => {
  let i = 0;
  return sql.replace(/\?/g, () => { const value = params[i++];
    return value === null ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`; }) + ';';
}).join('\n\n');
