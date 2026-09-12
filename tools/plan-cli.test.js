// Fresh production inputs and fail-closed command-line planning, all offline.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteContent } from '../apps/web/src/content.js';
import { planProductionContent, productionContentSql, TARGET_TABLES } from './production-content-plan.js';
import { readSnapshotCsv } from './content-bootstrap.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const databaseId = '00000000-0000-4000-8000-000000000001';
const migration = readFileSync(new URL('../migrations/app/0001_init.sql', import.meta.url), 'utf8');
const schemaGapFields = [
  ['hero.primaryButtonHref', '#portfolio'],
  ['hero.secondaryButtonHref', '/contact'],
  ['about.block1.sections[0].period', '2009 — 2024'],
  ['about.block1.sections[1].period', '2025 — PRESENT'],
  ['about.chips', ['Remote & Hybrid Ready', 'Software Development', 'QA Automation', 'Orange County, CA']],
  ['portfolio.cards[0].technology', 'Project'],
  ['portfolio.cards[1].technology', 'Project'],
  ['portfolio.cards[2].technology', 'Project'],
  ['portfolio.cards[3].technology', 'Project'],
  ['cta.buttonHref', '/contact'],
  ['footer.bottomSignature', '© 2026 Hakan.run — Built under DNDR Labs.'],
  ['footer.bottomLocation', 'Orange County, CA USA'],
];
const approvedSupplement = () => ({
  contract: 1,
  purpose: 'production-content-schema-gap',
  source: {
    environment: 'staging',
    databaseName: 'hakan-run-app-staging',
    databaseId: '71a28b10-861f-4554-9e14-5464c7116394',
    evidenceSha256: '177bd86a7d8c27ac851060b608c6f6e6909dfc1c31841cd6ddddf67544bc64da',
    publishedRevisions: { hero: 6, about: 2, portfolio: 2, cta: 2, footer: 2 },
  },
  fields: schemaGapFields.map(([fieldPath, value]) => ({ path: fieldPath, value: structuredClone(value) })),
});
const segments = fieldPath => fieldPath.match(/[^.[\]]+/g);
const setAt = (root, fieldPath, value) => {
  const parts = segments(fieldPath); const last = parts.pop();
  const parent = parts.reduce((node, part) => node[part], root);
  parent[last] = structuredClone(value);
};
const openDb = () => { const db = new DatabaseSync(':memory:'); db.exec(migration); return db; };
const evidence = () => {
  const db = openDb();
  const schema = db.prepare("SELECT name,type,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'").all();
  db.close();
  return { contract: 1, environment: 'production', databaseId, checkedAt: new Date().toISOString(),
    schema, counts: Object.fromEntries(TARGET_TABLES.map(t => [t, 0])) };
};
const source = () => {
  const rows = readSnapshotCsv(readFileSync(new URL('./snapshots/production-site-content.csv', import.meta.url), 'utf8'));
  const content = Object.fromEntries(rows.map(row => [row.section, row.data]));
  content.hero.future = { safe: 'Keep this metadata' };
  return content;
};
const plan = (content = source(), target = evidence(), extras = {}) => {
  const { supplement = approvedSupplement(), supplementBytes = Buffer.from(JSON.stringify(supplement)),
    ...options } = extras;
  return planProductionContent({
    bytes: Buffer.from(JSON.stringify(content)), format: 'json', target, databaseId,
    supplementBytes, publicDirectory: path.join(root, 'apps/web/public'), ...options,
  });
};
const fixture = (t, content = source(), target = evidence(), supplement = approvedSupplement()) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'production-input-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const input = path.join(dir, 'fresh export.json'), state = path.join(dir, 'target.json');
  const supplementPath = path.join(dir, 'approved supplement.json');
  writeFileSync(input, JSON.stringify(content)); writeFileSync(state, JSON.stringify(target));
  writeFileSync(supplementPath, JSON.stringify(supplement));
  return { dir, input, state, supplementPath, args: ['--input', input, '--target-state', state,
    '--target-database-id', databaseId, '--supplement', supplementPath] };
};
const run = args => spawnSync(process.execPath, [path.join(root, 'tools/plan-content-bootstrap.js'), ...args], { encoding: 'utf8' });

test('fresh content preserves values and identities, applying only approved normalization', () => {
  const original = source();
  const { dataset, statements } = plan(original);
  const expected = structuredClone(original);
  expected.typography = structuredClone(siteContent.typography);
  expected.visibility = structuredClone(siteContent.visibility);
  for (const [fieldPath, value] of schemaGapFields) setAt(expected, fieldPath, value);
  expected.header.navLinks = ['/#services', '/#portfolio', '/#about']
    .map(href => expected.header.navLinks.find(link => link.href === href));
  expected.about.block1.image = '/media/HakanDundar.webp';
  delete expected.contact.formEndpoint;
  assert.deepEqual(dataset.sections, expected, 'only declared promotions, supplements and normalization may differ');
  assert.deepEqual(original.header.navLinks, source().header.navLinks, 'input must not mutate');
  const db = openDb();
  db.exec('BEGIN'); db.exec(productionContentSql(statements)); db.exec('COMMIT');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM content_sections').get().n, 12);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM content_revisions').get().n, 12);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM audit_events').get().n, 12);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM content_sections WHERE draft_data IS NOT NULL OR published_revision != 1').get().n, 0);
  assert.throws(() => db.exec(productionContentSql(statements)), /malformed JSON/);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM content_revisions').get().n, 12);
  db.close();
});

test('valid supplement produces twelve canonical sections and complete field provenance', () => {
  const { dataset, report } = plan();
  assert.equal(Object.keys(dataset.sections).length, 12);
  assert.deepEqual(report.sections, [
    'colors', 'typography', 'visibility', 'header', 'hero', 'services',
    'about', 'portfolio', 'stats', 'cta', 'contact', 'footer',
  ]);
  assert.deepEqual(report.supplement.paths, schemaGapFields.map(([fieldPath]) => fieldPath));
  assert.equal(report.supplement.source.databaseId, '71a28b10-861f-4554-9e14-5464c7116394');
  assert.deepEqual(report.sectionProvenance, {
    colors: 'production-export', typography: 'approved-source-promotion',
    visibility: 'approved-source-promotion', header: 'production-export', hero: 'production-export',
    services: 'production-export', about: 'production-export', portfolio: 'production-export',
    stats: 'production-export', cta: 'production-export', contact: 'production-export', footer: 'production-export',
  });
  const supplemented = report.fieldProvenance.filter(item => item.type === 'owner-approved-schema-gap-supplement');
  assert.deepEqual(supplemented.map(item => item.path), schemaGapFields.map(([fieldPath]) => fieldPath));
  for (const item of supplemented) {
    assert.equal(item.originalState, 'missing');
    assert.equal(item.sourceEvidence.evidenceSha256,
      '177bd86a7d8c27ac851060b608c6f6e6909dfc1c31841cd6ddddf67544bc64da');
  }
  assert.equal(report.fieldProvenance.filter(item => item.type === 'approved-source-promotion').length, 8);
  assert.deepEqual(report.fieldProvenance.filter(item => item.type === 'deterministic-normalization')
    .map(item => item.path), ['header.navLinks', 'about.block1.image']);
  assert.deepEqual(report.fieldProvenance.filter(item => item.type === 'deterministic-exclusion')
    .map(item => item.path), ['contact.formEndpoint']);
});

test('supplement rejects a missing required path', () => {
  const supplement = approvedSupplement(); supplement.fields.pop();
  assert.throws(() => plan(source(), evidence(), { supplement }), /missing approved paths/);
});

test('supplement rejects an extra path', () => {
  const supplement = approvedSupplement(); supplement.fields.push({ path: 'hero.badge', value: 'extra' });
  assert.throws(() => plan(source(), evidence(), { supplement }), /not approved/);
});

test('supplement rejects a duplicate path', () => {
  const supplement = approvedSupplement(); supplement.fields.push(structuredClone(supplement.fields[0]));
  assert.throws(() => plan(source(), evidence(), { supplement }), /appears twice/);
});

test('supplement rejects malformed input and empty values', () => {
  assert.throws(() => plan(source(), evidence(), { supplementBytes: Buffer.from('{') }), /valid UTF-8 JSON/);
  for (const change of [
    supplement => { supplement.fields[0].path = 'hero..primaryButtonHref'; },
    supplement => { supplement.fields[0].value = null; },
    supplement => { supplement.fields[0].value = ''; },
    supplement => { supplement.fields[4].value = []; },
    supplement => { delete supplement.fields[0].value; },
    supplement => { supplement.unexpected = true; },
  ]) {
    const supplement = approvedSupplement(); change(supplement);
    assert.throws(() => plan(source(), evidence(), { supplement }));
  }
});

test('supplement never overrides a production value', () => {
  const content = source(); content.hero.primaryButtonHref = '#production-value';
  assert.throws(() => plan(content), /may not override production content: hero.primaryButtonHref/);
});

test('supplement source identity, revisions and evidence fingerprint are exact', () => {
  for (const change of [
    supplement => { supplement.source.databaseId = '00000000-0000-4000-8000-000000000002'; },
    supplement => { supplement.source.publishedRevisions.hero = 7; },
    supplement => { supplement.source.evidenceSha256 = '0'.repeat(64); },
  ]) {
    const supplement = approvedSupplement(); change(supplement);
    assert.throws(() => plan(source(), evidence(), { supplement }), /does not match the approved evidence/);
  }
});

test('target evidence must identify a fresh, empty, compatible production database', () => {
  for (const change of [t => { t.environment = 'staging'; }, t => { t.databaseId = 'other'; },
    t => { t.checkedAt = 'invalid'; }, t => { t.checkedAt = new Date(Date.now() - 86400001).toISOString(); },
    t => { t.checkedAt = new Date(Date.now() + 60000).toISOString(); },
    t => { t.schema.pop(); }, t => { t.schema[0].sql = 'CREATE TABLE content_sections(section TEXT)'; },
    t => { t.schema.push({ name: 'unexpected_trigger', type: 'trigger', sql: 'unexpected' }); },
    ...TARGET_TABLES.map(name => t => { t.counts[name] = 1; }), t => { delete t.counts; }]) {
    const target = evidence(); change(target); assert.throws(() => plan(source(), target));
  }
  assert.throws(() => plan(source(), undefined, { target: null }));
});

test('a target populated after planning is rejected before any seed write', () => {
  const { statements } = plan(); const db = openDb();
  db.prepare('INSERT INTO settings (key,value,updated_at) VALUES (?,?,?)').run('existing', 'preserve', 1);
  assert.throws(() => db.exec(productionContentSql(statements)), /malformed JSON/);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM content_sections').get().n, 0);
  assert.equal(db.prepare('SELECT value FROM settings').get().value, 'preserve'); db.close();
});

test('fresh exports fail closed on schema, missing sections, staging state and unexpected navigation', () => {
  for (const change of [s => { s.hero.badge = 3; }, s => { delete s.hero; },
    s => { s.unrecognized = {}; }, s => { s.hero.futureUrl = 'javascript:alert(1)'; },
    s => { s.portfolio.cards[1].id = s.portfolio.cards[0].id; },
    s => { s.header.navLinks[0].href = '/new'; },
    s => { s.about.block1.image = '/missing.png'; }]) {
    const content = source(); change(content); assert.throws(() => plan(content));
  }
  assert.throws(() => plan([{ section: 'hero', data: siteContent.hero, draft_data: '{}' }]));
});

test('explicit paths generate SQL-only output after all checks, with no upsert', t => {
  const f = fixture(t); const result = run([...f.args, '--sql-only']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^SELECT CASE WHEN/);
  assert.equal((result.stdout.match(/INSERT INTO content_sections/g) ?? []).length, 12);
  assert.equal((result.stdout.match(/INSERT INTO content_revisions/g) ?? []).length, 12);
  assert.equal((result.stdout.match(/INSERT INTO audit_events/g) ?? []).length, 12);
  assert.equal((result.stdout.match(/draft_data, published_data/g) ?? []).length, 12);
  assert.doesNotMatch(result.stdout, /\bUPDATE\b|\bUPSERT\b|\bDELETE\b|ON CONFLICT|INSERT OR REPLACE/i);
  assert.doesNotMatch(result.stdout, /71a28b10-861f-4554-9e14-5464c7116394|formspree|supabase/i);
  assert.ok(result.stderr.includes(`"databaseId": "${databaseId}"`), 'human diagnostics include the reviewed target identity');
  const db = openDb(); db.exec('BEGIN'); db.exec(result.stdout); db.exec('COMMIT');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM content_sections WHERE draft_data IS NOT NULL OR published_revision != 1').get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM content_revisions WHERE revision != 1 OR actor != 'bootstrap'").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM audit_events WHERE actor != 'bootstrap' OR action != 'content.bootstrap'").get().n, 0);
  db.close();
});

test('missing arguments, populated targets and conflicting modes emit no SQL', t => {
  const target = evidence(); target.counts.content_sections = 1; const f = fixture(t, source(), target);
  for (const args of [[], ['--sql-only'], [...f.args, '--sql-only'], [...f.args, '--sql', '--json'], ['--unknown']]) {
    const result = run(args); assert.notEqual(result.status, 0); assert.equal(result.stdout, '');
  }
  const knownStaging = '71a28b10-861f-4554-9e14-5464c7116394';
  const stagingArgs = [...f.args];
  stagingArgs[stagingArgs.indexOf('--target-database-id') + 1] = knownStaging;
  const result = run([...stagingArgs, '--sql-only']);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /staging database/); assert.equal(result.stdout, '');
});

test('fresh CSV and JSON inputs produce the same dataset; extra CSV columns are refused', t => {
  const f = fixture(t); const content = source();
  const csv = 'section,data\n' + Object.entries(content).map(([id, data]) => `${id},"${JSON.stringify(data).replace(/"/g, '""')}"`).join('\n');
  assert.deepEqual(plan(content).dataset, plan(content, evidence(), { format: 'csv', bytes: Buffer.from(csv) }).dataset);
  assert.throws(() => plan(content, evidence(), { format: 'csv', bytes: Buffer.from('section,data,draft_data\nhero,"{}","{}"') }));
  const csvPath = path.join(f.dir, 'fresh.csv'); writeFileSync(csvPath, csv);
  const result = run(['--input', csvPath, ...f.args.slice(2), '--json']);
  assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).plan.insert, 12);
});

test('target-query emits only read-only schema and count queries', () => {
  const result = run(['--target-query']); assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /INSERT|UPDATE|DELETE|DROP|CREATE/);
  assert.match(result.stdout, /sqlite_master/);
});
