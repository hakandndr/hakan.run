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

const root = fileURLToPath(new URL('../', import.meta.url));
const databaseId = '00000000-0000-4000-8000-000000000001';
const migration = readFileSync(new URL('../migrations/app/0001_init.sql', import.meta.url), 'utf8');
const openDb = () => { const db = new DatabaseSync(':memory:'); db.exec(migration); return db; };
const evidence = () => {
  const db = openDb();
  const schema = db.prepare("SELECT name,type,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'").all();
  db.close();
  return { contract: 1, environment: 'production', databaseId, checkedAt: new Date().toISOString(),
    schema, counts: Object.fromEntries(TARGET_TABLES.map(t => [t, 0])) };
};
const source = () => {
  const content = structuredClone(siteContent);
  delete content.typography; delete content.visibility;
  content.header.navLinks.reverse();
  content.about.block1.image = 'https://hakan.run/media/HakanDundar.webp';
  content.contact.formEndpoint = 'https://formspree.io/f/retired';
  content.hero.future = { safe: 'Keep this metadata' };
  return content;
};
const plan = (content = source(), target = evidence(), extras = {}) => planProductionContent({
  bytes: Buffer.from(JSON.stringify(content)), format: 'json', target, databaseId,
  publicDirectory: path.join(root, 'apps/web/public'), ...extras,
});
const fixture = (t, content = source(), target = evidence()) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'production-input-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const input = path.join(dir, 'fresh export.json'), state = path.join(dir, 'target.json');
  writeFileSync(input, JSON.stringify(content)); writeFileSync(state, JSON.stringify(target));
  return { dir, input, state, args: ['--input', input, '--target-state', state, '--target-database-id', databaseId] };
};
const run = args => spawnSync(process.execPath, [path.join(root, 'tools/plan-content-bootstrap.js'), ...args], { encoding: 'utf8' });

test('fresh content preserves values and identities, applying only approved normalization', () => {
  const original = source();
  const { dataset, statements } = plan(original);
  assert.deepEqual(dataset.sections.hero, original.hero);
  assert.deepEqual(dataset.sections.portfolio, original.portfolio);
  assert.deepEqual(dataset.sections.header.navLinks.map(l => l.href), ['/#services', '/#portfolio', '/#about']);
  assert.deepEqual(original.header.navLinks, source().header.navLinks, 'input must not mutate');
  assert.equal(dataset.sections.about.block1.image, '/media/HakanDundar.webp');
  assert.equal(dataset.sections.contact.formEndpoint, undefined);
  assert.deepEqual(dataset.sections.typography, siteContent.typography);
  assert.deepEqual(dataset.sections.visibility, siteContent.visibility);
  for (const id of ['services', 'stats', 'cta', 'footer', 'colors']) assert.deepEqual(dataset.sections[id], original[id]);
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
  assert.doesNotMatch(result.stdout, /ON CONFLICT|DO UPDATE|INSERT OR REPLACE/);
  assert.ok(result.stderr.includes(`"databaseId": "${databaseId}"`), 'human diagnostics include the reviewed target identity');
});

test('missing arguments, populated targets and conflicting modes emit no SQL', t => {
  const target = evidence(); target.counts.content_sections = 1; const f = fixture(t, source(), target);
  for (const args of [[], ['--sql-only'], [...f.args, '--sql-only'], [...f.args, '--sql', '--json'], ['--unknown']]) {
    const result = run(args); assert.notEqual(result.status, 0); assert.equal(result.stdout, '');
  }
  const knownStaging = '71a28b10-861f-4554-9e14-5464c7116394';
  const result = run([...f.args.slice(0, -1), knownStaging, '--sql-only']);
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
