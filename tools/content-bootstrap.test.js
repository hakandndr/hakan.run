// The bootstrap plan, proven against the real APP_DB schema.
//
// The property that matters most is idempotency: running the same snapshot
// twice must leave the database exactly as the first run did, with no second
// revision. A revision log that counts bootstrap runs instead of content
// changes is worse than no log, because it looks like history.

import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readSnapshot,
  planBootstrap,
  bootstrapStatements,
  bootstrapSql,
  compareToCanonical,
  canonicalJson,
  SnapshotError,
  BOOTSTRAP_ACTOR,
} from './content-bootstrap.js';
import { CANONICAL_SECTIONS } from '../worker/lib/content-sections.js';
import { publishedContentQuery, buildContentPayload } from '../worker/public/content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const openAppDb = () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(path.join(root, 'migrations/app/0001_init.sql'), 'utf8'));
  return db;
};

const currentRows = (db) =>
  db.prepare('SELECT section, published_data, published_revision FROM content_sections').all();

const apply = (db, plan) => {
  for (const { sql, params } of bootstrapStatements(plan)) db.prepare(sql).run(...params);
};

const SNAPSHOT = [
  { section: 'hero', data: { headingLine1: 'BUILD. DEPLOY.', headingLine2: 'RUN.' } },
  { section: 'footer', data: { brand: 'Hakan Dundar' } },
];

// --- Snapshot validation ----------------------------------------------------

test('an array export and an object export normalise to the same rows', () => {
  const fromArray = readSnapshot([{ section: 'hero', data: { a: 1 } }]);
  const fromObject = readSnapshot({ hero: { a: 1 } });
  assert.deepEqual(fromArray, fromObject);
});

test('an unrecognised snapshot shape is refused rather than coerced', () => {
  for (const bad of ['a string', 42, null, [], [{ section: 'hero' }], [{ section: '', data: {} }]]) {
    assert.throws(() => readSnapshot(bad), SnapshotError, `expected ${JSON.stringify(bad)} to be refused`);
  }
});

test('a duplicated section is refused, because one of the two would win silently', () => {
  assert.throws(
    () => readSnapshot([{ section: 'hero', data: { a: 1 } }, { section: 'hero', data: { a: 2 } }]),
    SnapshotError,
  );
});

test('a snapshot is compared against the canonical list rather than filtered by it', () => {
  const report = compareToCanonical(readSnapshot([{ section: 'hero', data: {} }, { section: 'extra', data: {} }]));
  assert.deepEqual(report.unknown, ['extra']);
  assert.ok(report.missing.includes('footer'));
  assert.equal(report.missing.length, CANONICAL_SECTIONS.length - 1);
});

// --- Idempotency ------------------------------------------------------------

test('a first run inserts every section at revision 1', () => {
  const db = openAppDb();
  const plan = planBootstrap(readSnapshot(SNAPSHOT), currentRows(db), 1000);

  assert.deepEqual(plan.summary, { insert: 2, update: 0, unchanged: 0 });
  apply(db, plan);

  const rows = currentRows(db).sort((a, b) => a.section.localeCompare(b.section));
  assert.deepEqual(rows.map((r) => [r.section, r.published_revision]), [['footer', 1], ['hero', 1]]);
});

test('rerunning the same snapshot does nothing at all', () => {
  const db = openAppDb();
  apply(db, planBootstrap(readSnapshot(SNAPSHOT), currentRows(db), 1000));

  const second = planBootstrap(readSnapshot(SNAPSHOT), currentRows(db), 2000);
  assert.deepEqual(second.summary, { insert: 0, update: 0, unchanged: 2 });
  assert.deepEqual(bootstrapStatements(second), [], 'an unchanged plan must emit no statements');

  apply(db, second);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM content_revisions').get().n, 2);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n, 2);
});

test('rerunning does not churn updated_at either', () => {
  const db = openAppDb();
  apply(db, planBootstrap(readSnapshot(SNAPSHOT), currentRows(db), 1000));
  const before = db.prepare('SELECT section, updated_at FROM content_sections ORDER BY section').all();

  apply(db, planBootstrap(readSnapshot(SNAPSHOT), currentRows(db), 999_999));
  const after = db.prepare('SELECT section, updated_at FROM content_sections ORDER BY section').all();

  assert.deepEqual(after, before);
});

test('key order in the snapshot is not a content change', () => {
  const db = openAppDb();
  apply(db, planBootstrap(readSnapshot([{ section: 'hero', data: { a: 1, b: 2 } }]), currentRows(db), 1000));

  const reordered = planBootstrap(readSnapshot([{ section: 'hero', data: { b: 2, a: 1 } }]), currentRows(db), 2000);
  assert.deepEqual(reordered.summary, { insert: 0, update: 0, unchanged: 1 });
});

test('a real change writes one new revision and bumps the published revision', () => {
  const db = openAppDb();
  apply(db, planBootstrap(readSnapshot(SNAPSHOT), currentRows(db), 1000));

  const changed = [{ section: 'hero', data: { headingLine1: 'NEW.' } }, SNAPSHOT[1]];
  const plan = planBootstrap(readSnapshot(changed), currentRows(db), 2000);
  assert.deepEqual(plan.summary, { insert: 0, update: 1, unchanged: 1 });
  apply(db, plan);

  const hero = db.prepare('SELECT published_revision FROM content_sections WHERE section = ?').get('hero');
  assert.equal(hero.published_revision, 2);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM content_revisions WHERE section = ?').get('hero').n, 2);
});

// --- Schema conformance -----------------------------------------------------

test('revisions carry the actor and note the schema requires', () => {
  const db = openAppDb();
  apply(db, planBootstrap(readSnapshot(SNAPSHOT), currentRows(db), 1000));

  const revision = db.prepare('SELECT actor, note, created_at FROM content_revisions LIMIT 1').get();
  assert.equal(revision.actor, BOOTSTRAP_ACTOR);
  assert.ok(revision.note && revision.note.length > 0);
  assert.equal(revision.created_at, 1000);
});

test('the bootstrap leaves no draft behind', () => {
  const db = openAppDb();
  apply(db, planBootstrap(readSnapshot(SNAPSHOT), currentRows(db), 1000));

  const drafts = db.prepare('SELECT COUNT(*) AS n FROM content_sections WHERE draft_data IS NOT NULL').get();
  assert.equal(drafts.n, 0, 'a published snapshot is not evidence of an edit in progress');
});

test('the published revision and its revision row agree', () => {
  const db = openAppDb();
  apply(db, planBootstrap(readSnapshot(SNAPSHOT), currentRows(db), 1000));

  const mismatched = db
    .prepare(
      `SELECT s.section FROM content_sections s
       LEFT JOIN content_revisions r
         ON r.section = s.section AND r.revision = s.published_revision
       WHERE r.id IS NULL OR r.data <> s.published_data`,
    )
    .all();
  assert.deepEqual(mismatched, []);
});

// --- The bootstrap and the public read path agree ---------------------------

test('bootstrapped content is exactly what /api/content then serves', () => {
  const db = openAppDb();
  apply(db, planBootstrap(readSnapshot(SNAPSHOT), currentRows(db), 1000));

  const query = publishedContentQuery();
  const payload = buildContentPayload(db.prepare(query.sql).all(...query.params));

  assert.deepEqual(payload.sections.map((s) => s.id), ['hero', 'footer']);
  assert.deepEqual(payload.sections[0].data, SNAPSHOT[0].data);
  assert.equal(payload.sections[0].revision, 1);
  assert.equal(payload.publishedAt, 1000);
});

// --- Direction ---------------------------------------------------------------

test('no generated statement can touch production', () => {
  const sql = bootstrapSql(planBootstrap(readSnapshot(SNAPSHOT), [], 1000));
  assert.ok(!/site_content/i.test(sql), 'the production table is a read source and is never written');
  assert.ok(!/supabase/i.test(sql));
  assert.match(sql, /INSERT INTO content_sections/);
});

test('quoting survives content that contains quotes', () => {
  const sql = bootstrapSql(
    planBootstrap(readSnapshot([{ section: 'hero', data: { t: "it's a test'; DROP TABLE x; --" } }]), [], 1000),
  );
  assert.ok(sql.includes("it''s"), 'single quotes must be doubled, not escaped away');
});

test('canonicalJson is stable across key order and nesting', () => {
  assert.equal(
    canonicalJson({ b: [1, { d: 4, c: 3 }], a: 1 }),
    canonicalJson({ a: 1, b: [1, { c: 3, d: 4 }] }),
  );
});
