import { siteContent } from '../../apps/web/src/content.js';
import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handleContentManagement, validateContent } from '../boss/content-management.js';
import { buildContentPayload, publishedContentQuery } from '../public/content.js';

// The three tables and constraints below reproduce the supplied APP_DB schema.
// The adapter uses real SQLite transactions, not a mocked SQL parser.
const schema = `
CREATE TABLE content_sections (
 section TEXT PRIMARY KEY, draft_data TEXT, published_data TEXT,
 draft_updated_at INTEGER, published_at INTEGER, published_revision INTEGER,
 updated_at INTEGER NOT NULL);
CREATE TABLE content_revisions (
 id INTEGER PRIMARY KEY AUTOINCREMENT, section TEXT NOT NULL,
 revision INTEGER NOT NULL, data TEXT NOT NULL, created_at INTEGER NOT NULL,
 actor TEXT NOT NULL, note TEXT, UNIQUE(section,revision));
CREATE TABLE audit_events (
 id TEXT PRIMARY KEY, occurred_at INTEGER NOT NULL, actor TEXT NOT NULL,
 action TEXT NOT NULL, object_type TEXT NOT NULL, object_id TEXT,
 detail TEXT, request_id TEXT);`;

const adapter = () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(schema);
  const wrap = (sql, args = []) => ({
    bind(...values) { return wrap(sql, values); },
    async first() { return sqlite.prepare(sql).get(...args) ?? null; },
    async all() { return { results: sqlite.prepare(sql).all(...args) }; },
    async run() {
      const result = sqlite.prepare(sql).run(...args);
      return { meta: { changes: Number(result.changes) } };
    },
    execute() {
      const statement = sqlite.prepare(sql);
      if (/^\s*SELECT\b/i.test(sql)) return { results: statement.all(...args), meta: { changes: 0 } };
      const result = statement.run(...args);
      return { results: [], meta: { changes: Number(result.changes) } };
    },
  });
  return {
    sqlite,
    prepare: (sql) => wrap(sql),
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map((statement) => statement.execute());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
};
const createSetup = (environment) => {
  const db = adapter();
  db.sqlite.prepare(`INSERT INTO content_sections
    (section, published_data, published_revision, published_at, updated_at)
    VALUES ('hero', ?, 1, 100, 100)`).run(JSON.stringify({ ...siteContent.hero, headingLine1: 'Original' }));
  db.sqlite.prepare(`INSERT INTO content_revisions
    (section, revision, data, created_at, actor, note) VALUES ('hero', 1, ?, 100, 'bootstrap', '')`)
    .run(JSON.stringify({ ...siteContent.hero, headingLine1: 'Original' }));
  return { APP_DB: db, ENVIRONMENT: environment, CMS_PRODUCTION_WRITES_ENABLED: environment === 'production' ? 'true' : undefined };
};
const request = (method, path, payload, origin = 'https://staging.hakan.run') =>
  new Request(`https://staging.hakan.run/api/boss/content/${path}`, {
    method,
    headers: { 'content-type': 'application/json', origin },
    ...(['GET', 'HEAD'].includes(method) ? {} : { body: JSON.stringify(payload) }),
  });
const call = async (env, method, path, payload) => {
  if (payload?.data) payload = { ...payload, data: { ...siteContent.hero, ...payload.data } };
  const base = request(method, path, payload);
  const req = env.ENVIRONMENT === 'production'
    ? new Request(base.url.replace('staging.hakan.run', 'hakan.run'), {
      method, headers: { 'content-type': 'application/json', origin: 'https://hakan.run' },
      ...(['GET', 'HEAD'].includes(method) ? {} : { body: JSON.stringify(payload) }),
    }) : base;
  const response = await handleContentManagement(req, env, { email: 'hakan@dndr.net' }, new URL(req.url).pathname);
  return { status: response.status, data: await response.json() };
};
const expected = (row) => ({ expectedVersion: row.updatedAt, expectedRevision: row.publishedRevision ?? 0 });
const detail = async (env) => (await call(env, 'GET', 'hero')).data;

for (const environment of ['staging', 'production']) describe(environment, () => {
const setup = () => createSetup(environment);

test('draft save does not change public content, and publish creates one revision and audit', async () => {
  const env = setup();
  const initial = await detail(env);
  let result = await call(env, 'PUT', 'hero/draft', { ...expected(initial), data: { headingLine1: 'Revised' } });
  assert.equal(result.status, 200);
  const saved = result.data;
  assert.equal(saved.published.headingLine1, 'Original');
  assert.equal(saved.draft.headingLine1, 'Revised');
  assert.equal(saved.publishedRevision, 1);
  assert.ok(saved.updatedAt > initial.updatedAt);
  const before = buildContentPayload((await env.APP_DB.prepare(publishedContentQuery().sql).all()).results);
  assert.equal(before.sections[0].data.headingLine1, 'Original');
  result = await call(env, 'POST', 'hero/publish', { ...expected(saved), note: 'Approved' });
  assert.equal(result.status, 200);
  assert.equal(result.data.published.headingLine1, 'Revised');
  assert.equal(result.data.publishedRevision, 2);
  assert.equal(result.data.draft, null);
  assert.equal(env.APP_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM content_revisions').get().n, 2);
  assert.equal(env.APP_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n, 2);
  assert.equal(env.APP_DB.sqlite.prepare('SELECT actor FROM content_revisions WHERE revision = 2').get().actor, 'hakan@dndr.net');
});

test('stale version cannot overwrite a draft or add audit records', async () => {
  const env = setup();
  const initial = await detail(env);
  const saved = (await call(env, 'PUT', 'hero/draft', { ...expected(initial), data: { headingLine1: 'One' } })).data;
  const result = await call(env, 'PUT', 'hero/draft', { ...expected(initial), data: { headingLine1: 'Two' } });
  assert.equal(result.status, 409);
  assert.equal((await detail(env)).draft.headingLine1, 'One');
  assert.equal(env.APP_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n, 1);
  assert.ok(saved.updatedAt > initial.updatedAt);
});

test('a race after the initial read is stopped inside the transaction', async () => {
  const env = setup();
  const originalBatch = env.APP_DB.batch;
  let injected = false;
  env.APP_DB.batch = async (statements) => {
    if (!injected) {
      injected = true;
      env.APP_DB.sqlite.prepare('UPDATE content_sections SET updated_at = 200 WHERE section = ?').run('hero');
    }
    return originalBatch(statements);
  };
  const result = await call(env, 'PUT', 'hero/draft', {
    expectedVersion: 100, expectedRevision: 1, data: { headingLine1: 'Race' },
  });
  assert.equal(injected, true);
  assert.equal(result.status, 409);
  assert.equal(env.APP_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n, 0);
  assert.equal(env.APP_DB.sqlite.prepare('SELECT draft_data FROM content_sections').get().draft_data, null);
});

test('discard leaves publication unchanged; restore creates new immutable history', async () => {
  const env = setup();
  let row = await detail(env);
  row = (await call(env, 'PUT', 'hero/draft', { ...expected(row), data: { headingLine1: 'Second' } })).data;
  row = (await call(env, 'DELETE', 'hero/draft', expected(row))).data;
  assert.equal(row.draft, null);
  assert.equal(row.publishedRevision, 1);
  row = (await call(env, 'PUT', 'hero/draft', { ...expected(row), data: { headingLine1: 'Second' } })).data;
  row = (await call(env, 'POST', 'hero/publish', expected(row))).data;
  const blocked = await call(env, 'POST', 'hero/revisions/1', { ...expected(row), expectedVersion: 0 });
  assert.equal(blocked.status, 409);
  const restored = await call(env, 'POST', 'hero/revisions/1', expected(row));
  assert.equal(restored.status, 200);
  assert.equal(restored.data.publishedRevision, 3);
  assert.equal(restored.data.published.headingLine1, 'Original');
  assert.equal(env.APP_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM content_revisions').get().n, 3);
  const historical = await call(env, 'GET', 'hero/revisions/2');
  assert.equal(historical.data.data.headingLine1, 'Second');
});

test('validation, origin, and environment gates reject unsafe writes', async () => {
  const env = setup();
  const row = await detail(env);
  assert.throws(() => validateContent('hero', { headingLine1: 'x', href: 'javascript:alert(1)' }, row.published));
  assert.throws(() => validateContent('hero', { headingLine1: 'x', formEndpoint: 'https://formspree.io/f/x' }, row.published));
  const wrong = request('PUT', 'hero/draft', { ...expected(row), data: { headingLine1: 'x' } }, 'https://evil.example');
  assert.equal((await handleContentManagement(wrong, env, { email: 'hakan@dndr.net' }, new URL(wrong.url).pathname)).status, 403);
  env.ENVIRONMENT = 'production';
  delete env.CMS_PRODUCTION_WRITES_ENABLED;
  assert.equal((await call(env, 'PUT', 'hero/draft', { ...expected(row), data: { headingLine1: 'x' } })).status, 403);
  assert.equal(env.APP_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n, 0);
});

test('a failed revision insertion rolls back the entire publish batch', async () => {
  const env = setup();
  let row = await detail(env);
  row = (await call(env, 'PUT', 'hero/draft', { ...expected(row), data: { headingLine1: 'New' } })).data;
  env.APP_DB.sqlite.exec(`CREATE TRIGGER reject_revision BEFORE INSERT ON content_revisions
    WHEN NEW.revision = 2 BEGIN SELECT RAISE(ABORT, 'revision rejected'); END;`);
  await assert.rejects(() => call(env, 'POST', 'hero/publish', expected(row)), /revision rejected/);
  const after = await detail(env);
  assert.equal(after.publishedRevision, 1);
  assert.equal(after.published.headingLine1, 'Original');
  assert.equal(after.draft.headingLine1, 'New');
  assert.equal(env.APP_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n, 1);
});

test('publishing an unchanged draft clears it without a fake revision', async () => {
  const env = setup();
  let row = await detail(env);
  row = (await call(env, 'PUT', 'hero/draft', {
    ...expected(row), data: { headingLine1: 'Original' },
  })).data;
  const result = await call(env, 'POST', 'hero/publish', expected(row));
  assert.equal(result.status, 200);
  assert.equal(result.data.publishedRevision, 1);
  assert.equal(result.data.draft, null);
  assert.equal(env.APP_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM content_revisions').get().n, 1);
  assert.equal(env.APP_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n, 2);
});

test('restore refuses to replace an outstanding draft', async () => {
  const env = setup();
  let row = await detail(env);
  row = (await call(env, 'PUT', 'hero/draft', {
    ...expected(row), data: { headingLine1: 'Unsaved publication' },
  })).data;
  const result = await call(env, 'POST', 'hero/revisions/1', expected(row));
  assert.equal(result.status, 409);
  assert.equal((await detail(env)).draft.headingLine1, 'Unsaved publication');
});

});

test('production opt-in is exact and cannot enable unknown environments', async () => {
  for (const environment of ['production', 'development', undefined]) {
    for (const flag of [undefined, false, true, 'false', 'TRUE', '1', 'true']) {
      if (environment === 'production' && flag === 'true') continue;
      const env = { ...createSetup(environment), CMS_PRODUCTION_WRITES_ENABLED: flag };
      for (const [method, path] of [['PUT', 'hero/draft'], ['DELETE', 'hero/draft'], ['POST', 'hero/publish'], ['POST', 'hero/revisions/1']]) {
        assert.equal((await call(env, method, path, { expectedVersion: 100, expectedRevision: 1 })).status, 403);
      }
      assert.equal(env.APP_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n, 0);
      env.APP_DB.sqlite.close();
    }
  }
});

test('enabled production denies absent, null and cross-origin mutations', async () => {
  const env = createSetup('production');
  for (const origin of [undefined, 'null', 'https://staging.hakan.run']) {
    const req = new Request('https://hakan.run/api/boss/content/hero/draft', {
      method: 'PUT', headers: origin === undefined ? {} : { origin },
      body: JSON.stringify({ expectedVersion: 100, expectedRevision: 1, data: siteContent.hero }),
    });
    assert.equal((await handleContentManagement(req, env, { email: 'hakan@dndr.net' }, new URL(req.url).pathname)).status, 403);
  }
  assert.equal(env.APP_DB.sqlite.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n, 0);
});
