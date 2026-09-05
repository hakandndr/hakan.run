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
import { toModuleUrl } from './module-url.js';
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

// ---------------------------------------------------------------------------
// Composition, exclusion, transform, and the real production snapshot.
// ---------------------------------------------------------------------------

import {
  parseCsv,
  readSnapshotCsv,
  composeDataset,
  validateDataset,
  datasetRows,
  assetReferences,
  verifyAssets,
  EXCLUDED_PATHS,
  TRANSFORM_RULES,
  PRODUCTION_ORIGIN,
} from './content-bootstrap.js';

const snapshotCsv = () =>
  readFileSync(path.join(root, 'tools/snapshots/production-site-content.csv'), 'utf8');

const fallbackContent = async () =>
  (await import(toModuleUrl(path.join(root, 'apps/web/src/content.js')))).siteContent;

const realDataset = async () =>
  composeDataset({ snapshot: readSnapshotCsv(snapshotCsv()), fallback: await fallbackContent() });

const publicDirectory = path.join(root, 'apps/web/public');

// --- CSV --------------------------------------------------------------------

test('the CSV parser handles commas, doubled quotes and newlines inside a field', () => {
  // The data column is a JSON blob full of exactly these characters, which is
  // why this is parsed rather than split.
  const rows = parseCsv('section,data\nhero,"a,b""c""\nstill same field"\n');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], ['section', 'data']);
  assert.deepEqual(rows[1], ['hero', 'a,b"c"\nstill same field']);
});

test('the parser round-trips a JSON payload containing a comma and an escaped quote', () => {
  const payload = { a: 'x,y', b: 'say "hi"' };
  const csv = `section,data\nhero,"${JSON.stringify(payload).replace(/"/g, '""')}"\n`;
  const [, row] = parseCsv(csv);
  assert.deepEqual(JSON.parse(row[1]), payload);
});

test('a CSV without the expected columns is refused', () => {
  assert.throws(() => readSnapshotCsv('id,payload\n1,{}\n'), SnapshotError);
});

test('a CSV row whose payload is not JSON is refused, and names the section', () => {
  assert.throws(
    () => readSnapshotCsv('section,data\nhero,not-json\n'),
    (error) => error instanceof SnapshotError && error.message.includes('hero'),
  );
});

test('the authoritative export parses to exactly ten production sections', () => {
  const snapshot = readSnapshotCsv(snapshotCsv());
  assert.equal(snapshot.length, 10);
  assert.deepEqual(
    snapshot.map((row) => row.section).sort(),
    ['about', 'colors', 'contact', 'cta', 'footer', 'header', 'hero', 'portfolio', 'services', 'stats'],
  );
});

// --- Composition ------------------------------------------------------------

test('the composed dataset is exactly the twelve canonical sections', async () => {
  const dataset = await realDataset();
  assert.deepEqual(Object.keys(dataset.sections).sort(), [...CANONICAL_SECTIONS].sort());
  assert.equal(Object.keys(dataset.sections).length, 12);
});

test('each section names its source, and only two come from the bundle', async () => {
  const { provenance } = await realDataset();
  const fromFallback = Object.keys(provenance).filter((id) => provenance[id] === 'fallback');
  assert.deepEqual(fromFallback.sort(), ['typography', 'visibility']);
  assert.equal(Object.values(provenance).filter((p) => p === 'production').length, 10);
});

test('typography and visibility carry the bundle values unchanged — only the authority moves', async () => {
  const dataset = await realDataset();
  const fallback = await fallbackContent();
  assert.deepEqual(dataset.sections.typography, fallback.typography);
  assert.deepEqual(dataset.sections.visibility, fallback.visibility);
});

test('a section present in both sources takes production, never a blend', async () => {
  const dataset = composeDataset({
    snapshot: [{ section: 'hero', data: { headingLine1: 'FROM PRODUCTION' } }],
    fallback: { hero: { headingLine1: 'FROM FALLBACK', headingLine2: 'EXTRA' }, ...Object.fromEntries(
      CANONICAL_SECTIONS.filter((id) => id !== 'hero').map((id) => [id, {}]),
    ) },
  });
  assert.deepEqual(dataset.sections.hero, { headingLine1: 'FROM PRODUCTION' });
});

test('a canonical section no source supplies is refused rather than seeded empty', () => {
  assert.throws(() => composeDataset({ snapshot: [], fallback: {} }), SnapshotError);
});

test('a snapshot section outside the canonical list stops the composition', () => {
  const fallback = Object.fromEntries(CANONICAL_SECTIONS.map((id) => [id, {}]));
  assert.throws(
    () => composeDataset({ snapshot: [{ section: 'newsletter', data: {} }], fallback }),
    (error) => error instanceof SnapshotError && error.message.includes('newsletter'),
  );
});

// --- Exclusion --------------------------------------------------------------

test('the legacy form endpoint is removed, and reported as removed', async () => {
  const dataset = await realDataset();
  assert.equal(dataset.sections.contact.formEndpoint, undefined);
  assert.deepEqual(dataset.excluded, [
    { path: 'contact.formEndpoint', value: 'https://formspree.io/f/maqapajb' },
  ]);
  assert.deepEqual(EXCLUDED_PATHS, ['contact.formEndpoint']);
});

test('no formspree string survives anywhere in the dataset', async () => {
  const dataset = await realDataset();
  assert.ok(!/formspree/i.test(JSON.stringify(dataset.sections)));
});

test('the rest of the contact section is untouched by the exclusion', async () => {
  const dataset = await realDataset();
  assert.deepEqual(
    Object.keys(dataset.sections.contact).sort(),
    ['heading', 'headingAccent', 'infoBlocks', 'metaDescription', 'pageTitle', 'socialLinks', 'subtitle'],
  );
});

// --- Transform --------------------------------------------------------------

test('the one absolute production image URL becomes root-relative', async () => {
  const dataset = await realDataset();
  assert.equal(dataset.sections.about.block1.image, '/media/HakanDundar.webp');
  assert.deepEqual(dataset.transformed, [
    {
      path: 'about.block1.image',
      from: `${PRODUCTION_ORIGIN}/media/HakanDundar.webp`,
      to: '/media/HakanDundar.webp',
    },
  ]);
});

test('a transform whose expected value no longer matches fails loudly', () => {
  const fallback = Object.fromEntries(CANONICAL_SECTIONS.map((id) => [id, {}]));
  assert.throws(
    () =>
      composeDataset({
        snapshot: [{ section: 'about', data: { block1: { image: 'https://hakan.run/media/SOMETHING-ELSE.webp' } } }],
        fallback,
      }),
    (error) => error instanceof SnapshotError && error.message.includes('about.block1.image'),
  );
});

test('a transform already applied is a no-op rather than a failure', () => {
  const fallback = Object.fromEntries(CANONICAL_SECTIONS.map((id) => [id, {}]));
  const dataset = composeDataset({
    snapshot: [{ section: 'about', data: { block1: { image: '/media/HakanDundar.webp' } } }],
    fallback,
  });
  assert.deepEqual(dataset.transformed, []);
  assert.equal(dataset.sections.about.block1.image, '/media/HakanDundar.webp');
});

test('legitimate external URLs are preserved', async () => {
  const dataset = await realDataset();
  assert.deepEqual(
    dataset.sections.portfolio.cards.map((card) => card.externalUrl),
    ['https://dndr.net', 'https://turkcyber.com', 'https://turkiyecennet.com', 'https://americawhat.com'],
  );
  assert.equal(dataset.sections.contact.socialLinks.length, 4);
  assert.ok(dataset.sections.footer.socialLinks.every((link) => link.url.startsWith('https://')));
  assert.equal(TRANSFORM_RULES.length, 1, 'only one field is rewritten; the rest are genuinely off-site');
});

test('any unhandled production-origin URL is a validation failure, not a silent pass', () => {
  const fallback = Object.fromEntries(CANONICAL_SECTIONS.map((id) => [id, {}]));
  const dataset = composeDataset({
    snapshot: [{ section: 'footer', data: { logo: `${PRODUCTION_ORIGIN}/media/new-thing.svg` } }],
    fallback,
  });
  const problems = validateDataset(dataset, null);
  assert.ok(problems.some((problem) => problem.includes('production origin')));
});

// --- Assets -----------------------------------------------------------------

test('every image the dataset references exists locally', async () => {
  const dataset = await realDataset();
  const { references, missing } = verifyAssets(dataset.sections, publicDirectory);

  assert.equal(references.length, 6, 'two media images and four portfolio images');
  assert.deepEqual(
    missing.map(({ asset }) => asset),
    [],
    'A dataset naming images the site does not serve would make the content authority wrong on its first day, invisibly.',
  );
})

test('the four production portfolio images are the ones the gate was waiting for', async () => {
  const dataset = await realDataset();
  const { references } = verifyAssets(dataset.sections, publicDirectory);
  assert.deepEqual(references.map(({ asset }) => asset), [
    '/media/HakanDundar.webp',
    '/media/hkndesk.webp',
    '/portfolio/americawhat.webp',
    '/portfolio/dndr-labs.webp',
    '/portfolio/turkcyber.webp',
    '/portfolio/turkiyecennet-en.webp',
  ]);
})

test('the four production portfolio images are referenced by their exact filenames', async () => {
  const dataset = await realDataset();
  assert.deepEqual(
    dataset.sections.portfolio.cards.map((card) => card.imgSrc),
    [
      '/portfolio/dndr-labs.webp',
      '/portfolio/turkcyber.webp',
      '/portfolio/turkiyecennet-en.webp',
      '/portfolio/americawhat.webp',
    ],
  );
});

test('a missing asset is reported with the field that references it', () => {
  const fallback = Object.fromEntries(CANONICAL_SECTIONS.map((id) => [id, {}]));
  const dataset = composeDataset({
    snapshot: [{ section: 'portfolio', data: { cards: [{ imgSrc: '/portfolio/nope.webp' }] } }],
    fallback,
  });
  const problems = validateDataset(dataset, publicDirectory);
  assert.ok(problems.some((p) => p.includes('/portfolio/nope.webp') && p.includes('cards[0].imgSrc')));
});

test('asset detection ignores non-asset strings', () => {
  const found = assetReferences({ a: { b: 'https://dndr.net', c: '/contact', d: '/media/x.webp' } });
  assert.deepEqual(found.map((entry) => entry.asset), ['/media/x.webp']);
});

// --- Validation gate --------------------------------------------------------

test('the real dataset passes every validation, assets included', async () => {
  assert.deepEqual(validateDataset(await realDataset(), publicDirectory), []);
})

test('the asset gate still bites when an image is genuinely absent', async () => {
  // The gate is open now because the files are here, not because it stopped
  // checking. Removing one from the dataset must close it again.
  const dataset = await realDataset();
  dataset.sections.portfolio.cards[0].imgSrc = '/portfolio/not-supplied.webp';

  const problems = validateDataset(dataset, publicDirectory);
  assert.equal(problems.length, 1);
  assert.ok(problems[0].includes('/portfolio/not-supplied.webp'));
  assert.ok(problems[0].includes('cards[0].imgSrc'));
})

test('a dataset short of twelve sections is refused', () => {
  const problems = validateDataset({ sections: { hero: {} } }, null);
  assert.ok(problems.some((p) => p.includes('expected 12 sections')));
});

// --- Idempotency after normalization ----------------------------------------

test('the normalized dataset bootstraps, then re-bootstraps to nothing', async () => {
  const db = openAppDb();
  const rows = datasetRows(await realDataset());

  const first = planBootstrap(readSnapshot(rows), currentRows(db), 1000);
  assert.deepEqual(first.summary, { insert: 12, update: 0, unchanged: 0 });
  apply(db, first);

  // Re-derived from the same CSV and the same bundle, through the whole
  // normalize/exclude/transform pipeline — not from the rows already computed.
  const second = planBootstrap(readSnapshot(datasetRows(await realDataset())), currentRows(db), 2000);
  assert.deepEqual(second.summary, { insert: 0, update: 0, unchanged: 12 });
  assert.deepEqual(bootstrapStatements(second), []);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM content_revisions').get().n, 12);
});

test('one changed section produces exactly one new revision, and only there', async () => {
  const db = openAppDb();
  const dataset = await realDataset();
  apply(db, planBootstrap(readSnapshot(datasetRows(dataset)), currentRows(db), 1000));

  const changed = await realDataset();
  changed.sections.cta = { ...changed.sections.cta, button: 'Say Hello' };

  const plan = planBootstrap(readSnapshot(datasetRows(changed)), currentRows(db), 2000);
  assert.deepEqual(plan.summary, { insert: 0, update: 1, unchanged: 11 });
  apply(db, plan);

  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM content_revisions').get().n, 13);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM content_revisions WHERE section = ?').get('cta').n, 2);
  assert.equal(db.prepare('SELECT published_revision FROM content_sections WHERE section = ?').get('cta').published_revision, 2);
  assert.equal(db.prepare('SELECT published_revision FROM content_sections WHERE section = ?').get('hero').published_revision, 1);
});

// --- Read-back through the real public contract -----------------------------

test('/api/content serves the normalized dataset exactly', async () => {
  const db = openAppDb();
  const dataset = await realDataset();
  apply(db, planBootstrap(readSnapshot(datasetRows(dataset)), currentRows(db), 1000));

  const query = publishedContentQuery();
  const payload = buildContentPayload(db.prepare(query.sql).all(...query.params));

  assert.equal(payload.count, 12);
  assert.deepEqual(payload.sections.map((s) => s.id), CANONICAL_SECTIONS);
  for (const section of payload.sections) {
    assert.deepEqual(section.data, dataset.sections[section.id], `section ${section.id} differs on read-back`);
    assert.equal(section.revision, 1);
  }
});

test('the generated SQL carries no formspree, no supabase and no production origin', async () => {
  const sql = bootstrapSql(planBootstrap(readSnapshot(datasetRows(await realDataset())), [], 1000));
  assert.ok(!/formspree/i.test(sql));
  assert.ok(!/supabase/i.test(sql));
  assert.ok(!sql.includes(`${PRODUCTION_ORIGIN}/`));
});
