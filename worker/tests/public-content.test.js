// The public content read path: published-only, deterministic, fail-closed.
//
// These run the real APP_DB migration in an in-memory SQLite database, through
// the same query the Worker issues. D1 is SQLite, so a result proven here is
// the result the deployed Worker produces.

import test from 'node:test';
import assert from 'node:assert/strict';
import { openAppDb, runner } from './helpers.js';
import worker from '../index.js';
import { CANONICAL_SECTIONS, compareSections } from '../lib/content-sections.js';
import {
  publishedContentQuery,
  buildContentPayload,
  ContentCorruptError,
} from '../public/content.js';

const put = (db, { section, published = null, draft = null, revision = null, publishedAt = null, updatedAt = 1 }) =>
  db
    .prepare(
      `INSERT INTO content_sections
         (section, draft_data, published_data, draft_updated_at, published_at, published_revision, updated_at)
       VALUES (?, ?, ?, NULL, ?, ?, ?)`,
    )
    .run(
      section,
      draft === null ? null : JSON.stringify(draft),
      published === null ? null : (typeof published === 'string' ? published : JSON.stringify(published)),
      publishedAt,
      revision,
      updatedAt,
    );

const readSections = async (db) => {
  const query = publishedContentQuery();
  const rows = await runner(db)(query);
  return buildContentPayload(rows);
};

// --- Publication filtering --------------------------------------------------

test('an unpublished section is absent, not present and empty', async () => {
  const db = openAppDb();
  put(db, { section: 'hero', published: { headingLine1: 'BUILD.' }, revision: 1, publishedAt: 100 });
  put(db, { section: 'about', draft: { body: 'not live yet' } });

  const payload = await readSections(db);
  assert.deepEqual(payload.sections.map((s) => s.id), ['hero']);
  assert.equal(payload.count, 1);
});

test('a draft never reaches the public payload, even alongside a publish', async () => {
  const db = openAppDb();
  put(db, {
    section: 'hero',
    published: { headingLine1: 'PUBLISHED' },
    draft: { headingLine1: 'DRAFT' },
    revision: 2,
    publishedAt: 100,
  });

  const payload = await readSections(db);
  assert.deepEqual(payload.sections[0].data, { headingLine1: 'PUBLISHED' });
});

test('a published_at with no published_data is not publication', async () => {
  // A half-written publish must not be readable as content. The query requires
  // both halves rather than trusting the timestamp alone.
  const db = openAppDb();
  put(db, { section: 'hero', published: null, publishedAt: 100, revision: 1 });

  const payload = await readSections(db);
  assert.deepEqual(payload.sections, []);
  assert.equal(payload.publishedAt, null);
});

test('no published content is an empty payload, which is a valid answer', async () => {
  const payload = await readSections(openAppDb());
  assert.deepEqual(payload, { contract: 1, count: 0, publishedAt: null, sections: [] });
});

// --- Ordering ---------------------------------------------------------------

test('sections come back in the canonical order, not the storage order', async () => {
  const db = openAppDb();
  // Inserted in reverse, which is also the reverse of alphabetical for these.
  for (const [index, section] of [...CANONICAL_SECTIONS].reverse().entries()) {
    put(db, { section, published: { s: section }, revision: 1, publishedAt: 100 + index });
  }

  const payload = await readSections(db);
  assert.deepEqual(payload.sections.map((s) => s.id), CANONICAL_SECTIONS);
});

test('a section outside the canonical list is ordered after it, by id', () => {
  const ordered = ['zeta', 'hero', 'alpha', 'colors'].sort(compareSections);
  assert.deepEqual(ordered, ['colors', 'hero', 'alpha', 'zeta']);
});

test('ordering is total, so the payload cannot vary between identical reads', async () => {
  const db = openAppDb();
  for (const section of ['footer', 'hero', 'custom-two', 'custom-one']) {
    put(db, { section, published: { s: section }, revision: 1, publishedAt: 100 });
  }
  const first = await readSections(db);
  const second = await readSections(db);
  assert.deepEqual(first.sections.map((s) => s.id), second.sections.map((s) => s.id));
  assert.deepEqual(first.sections.map((s) => s.id), ['hero', 'footer', 'custom-one', 'custom-two']);
});

// --- Fail closed on malformed persisted content -----------------------------

test('unparseable published_data fails the whole response, not just its section', () => {
  assert.throws(
    () => buildContentPayload([{ section: 'hero', published_data: '{not json', published_revision: 1, published_at: 1 }]),
    ContentCorruptError,
  );
});

test('a JSON scalar or array is not a section payload and is treated as corrupt', () => {
  for (const value of ['"a string"', '42', 'null', '[1,2,3]']) {
    assert.throws(
      () => buildContentPayload([{ section: 'hero', published_data: value, published_revision: 1, published_at: 1 }]),
      ContentCorruptError,
      `expected ${value} to be rejected`,
    );
  }
});

test('one corrupt section does not let the others answer as if the site were complete', () => {
  // The dangerous version of this bug is silent: drop the bad row, return the
  // rest, and the client renders its fallback for the missing section and calls
  // that a success. Nothing would report the corruption.
  assert.throws(
    () =>
      buildContentPayload([
        { section: 'hero', published_data: '{"ok":true}', published_revision: 1, published_at: 1 },
        { section: 'footer', published_data: '{{{', published_revision: 1, published_at: 1 },
      ]),
    (error) => error instanceof ContentCorruptError && error.section === 'footer',
  );
});

// --- Contract ---------------------------------------------------------------

test('each section carries its id, revision, publish time and data', async () => {
  const db = openAppDb();
  put(db, { section: 'hero', published: { a: 1 }, revision: 7, publishedAt: 1757000000000 });

  const [section] = (await readSections(db)).sections;
  assert.deepEqual(section, { id: 'hero', revision: 7, publishedAt: 1757000000000, data: { a: 1 } });
});

test('publishedAt is the newest publish across sections', async () => {
  const db = openAppDb();
  put(db, { section: 'hero', published: { a: 1 }, revision: 1, publishedAt: 100 });
  put(db, { section: 'footer', published: { b: 2 }, revision: 1, publishedAt: 900 });

  assert.equal((await readSections(db)).publishedAt, 900);
});

// --- Routing and method -----------------------------------------------------

const appDbStub = (rows) => ({
  prepare: () => ({ bind: () => ({ all: async () => ({ results: rows }) }) }),
});

const publicRequest = (path, init) => new Request(`https://staging.hakan.run${path}`, init);

test('GET /api/content answers from APP_DB without Access', async () => {
  const response = await worker.fetch(
    publicRequest('/api/content'),
    { APP_DB: appDbStub([{ section: 'hero', published_data: '{"a":1}', published_revision: 1, published_at: 5 }]) },
    {},
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.sections.map((s) => s.id), ['hero']);
});

test('a write method is rejected rather than routed', async () => {
  const response = await worker.fetch(
    publicRequest('/api/content', { method: 'POST' }),
    { APP_DB: appDbStub([]) },
    {},
  );
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});

test('a missing APP_DB binding fails closed rather than answering empty', async () => {
  const response = await worker.fetch(publicRequest('/api/content'), {}, {});
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'content_unavailable' });
});

test('corrupt storage answers 500 and names the section', async () => {
  const response = await worker.fetch(
    publicRequest('/api/content'),
    { APP_DB: appDbStub([{ section: 'footer', published_data: 'nope', published_revision: 1, published_at: 5 }]) },
    {},
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'content_corrupt', section: 'footer' });
});

// --- Cache behaviour --------------------------------------------------------

test('the response is publicly cacheable and carries a validator', async () => {
  const env = { APP_DB: appDbStub([{ section: 'hero', published_data: '{"a":1}', published_revision: 1, published_at: 5 }]) };
  const response = await worker.fetch(publicRequest('/api/content'), env, {});
  assert.match(response.headers.get('cache-control'), /public/);
  assert.match(response.headers.get('cache-control'), /max-age=60/);
  assert.ok(response.headers.get('etag'));
});

test('an unchanged payload answers 304 to a conditional request', async () => {
  const env = { APP_DB: appDbStub([{ section: 'hero', published_data: '{"a":1}', published_revision: 1, published_at: 5 }]) };
  const first = await worker.fetch(publicRequest('/api/content'), env, {});
  const etag = first.headers.get('etag');

  const second = await worker.fetch(
    publicRequest('/api/content', { headers: { 'if-none-match': etag } }),
    env,
    {},
  );
  assert.equal(second.status, 304);
  assert.equal(second.headers.get('etag'), etag);
});

test('a changed payload gets a different validator', async () => {
  const one = await worker.fetch(
    publicRequest('/api/content'),
    { APP_DB: appDbStub([{ section: 'hero', published_data: '{"a":1}', published_revision: 1, published_at: 5 }]) },
    {},
  );
  const two = await worker.fetch(
    publicRequest('/api/content'),
    { APP_DB: appDbStub([{ section: 'hero', published_data: '{"a":2}', published_revision: 2, published_at: 6 }]) },
    {},
  );
  assert.notEqual(one.headers.get('etag'), two.headers.get('etag'));
});

// --- The boundary this endpoint must not cross ------------------------------

test('the Worker contains no Supabase client on any path', async () => {
  const { readFileSync, readdirSync, statSync } = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const workerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

  const files = (directory) =>
    readdirSync(directory).flatMap((entry) => {
      const full = path.join(directory, entry);
      if (statSync(full).isDirectory()) return entry === 'tests' ? [] : files(full);
      return full.endsWith('.js') ? [full] : [];
    });

  // Prose explaining the rule names the thing it forbids, so comments are
  // stripped first: the question is what the Worker can reach, not what it
  // documents. What would actually reach it is an import or a project URL.
  const withoutComments = (contents) =>
    contents.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const reaches = /@supabase\/|from\s+['"][^'"]*supabase|require\(\s*['"][^'"]*supabase|\.supabase\.co/i;

  const offenders = files(workerRoot).filter((file) => reaches.test(withoutComments(readFileSync(file, 'utf8'))));
  assert.deepEqual(
    offenders.map((file) => path.relative(workerRoot, file)),
    [],
    'Staging must not be able to reach production Supabase at runtime (D-020). That is a property of the code, not of configuration.',
  );
});
