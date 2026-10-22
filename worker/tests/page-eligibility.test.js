// PAGE eligibility: only the site's public pages are recorded (D-050).
//
// The rule lives in apps/web/src/router/public-pages.js. The browser applies it
// before sending a PAGE event and the Worker applies it again before anything
// is stored or forwarded, so a stale or forged request cannot write a page
// that does not exist. Removed project-detail paths (`/project/*`) are 404s
// and are refused like any other path that is not a page.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../index.js';
import { handlePageEvent } from '../analytics/ingest.js';
import { isPublicPage, normalizePath } from '../lib/routes.js';
import { isPublicPagePath, PUBLIC_PAGE_PATHS } from '../../apps/web/src/router/public-pages.js';
import { normalizePagePath } from '../../apps/web/src/content-source/analytics.js';
import { NOTE_SLUGS } from '../../apps/web/src/notes/manifest.js';
import { completeSiteContent } from '../../apps/web/test-fixtures/published-site.js';
import { openAnalyticsDb } from './helpers.js';

const ELIGIBLE = [...PUBLIC_PAGE_PATHS, ...NOTE_SLUGS.map((slug) => `/notes/${slug}`)];
const INELIGIBLE = [
  '/project/example', '/project/oc-ca', '/project/full-stack-development', '/project/', '/project',
  '/notes/not-a-real-note', '/notes/reachable-is-not-current/extra',
  '/no-such-page', '/admin', '/control-room', '/boss', '/api/content', '/assets/index.js',
];

// ANALYTICS_DB over a real SQLite schema, counting every statement prepared.
const d1 = (database) => {
  const prepared = [];
  return {
    prepared,
    prepare: (sql) => {
      prepared.push(sql);
      return { bind: (...params) => ({ run: async () => database.prepare(sql).run(...params) }) };
    },
  };
};

const collector = (database) => {
  const calls = [];
  return {
    calls,
    async recordPage(event) {
      // Source first: the row already exists when DNDR is called.
      calls.push({ event, rowsAtCall: database.prepare('SELECT COUNT(*) AS n FROM visitor_events').get().n });
      return { status: 'accepted' };
    },
  };
};

const context = () => {
  const pending = [];
  return { pending, waitUntil: (promise) => pending.push(promise), settled: () => Promise.all(pending) };
};

const pageRequest = (path, host = 'staging.hakan.run') => {
  const request = new Request(`https://${host}/api/analytics/page`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'CF-Connecting-IP': '203.0.113.17',
      'user-agent': 'Mozilla/5.0 Chrome/152.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({ path, referrer: null, sessionId: 'session-1' }),
  });
  Object.defineProperty(request, 'cf', { value: { country: 'US' } });
  return request;
};

const stagingEnv = (database, dndr) => ({
  ANALYTICS_ENABLED: 'true', ENVIRONMENT: 'staging', ANALYTICS_DB: d1(database), DNDR_COLLECTOR: dndr,
});

test('the browser and the Worker apply one eligibility rule', () => {
  assert.equal(isPublicPage, isPublicPagePath);
  for (const path of [...ELIGIBLE, ...INELIGIBLE, '/card/', '/notes/', `/notes/${NOTE_SLUGS[0]}/`, '/project/example/']) {
    const worker = isPublicPage(normalizePath(path));
    const browser = normalizePagePath(path) !== null;
    assert.equal(browser, worker, path);
  }
  for (const path of ELIGIBLE) assert.equal(isPublicPage(path), true, path);
  for (const path of INELIGIBLE) assert.equal(isPublicPage(normalizePath(path)), false, path);
});

test('a forged PAGE event for a path that is not a page is refused before storage or forwarding', async () => {
  for (const path of INELIGIBLE) {
    const database = openAnalyticsDb();
    const dndr = collector(database);
    const ctx = context();
    const env = stagingEnv(database, dndr);
    const response = await handlePageEvent(pageRequest(path), env, ctx);
    await ctx.settled();
    assert.equal(response.status, 422, path);
    assert.deepEqual(await response.json(), { error: 'not_a_public_page' }, path);
    assert.deepEqual(env.ANALYTICS_DB.prepared, [], `${path} must not reach ANALYTICS_DB`);
    assert.equal(database.prepare('SELECT COUNT(*) AS n FROM visitor_events').get().n, 0, path);
    assert.deepEqual(dndr.calls, [], `${path} must not reach DNDR`);
    assert.deepEqual(ctx.pending, [], path);
  }
});

test('the Worker route refuses a forged /project PAGE event end to end', async () => {
  const database = openAnalyticsDb();
  const dndr = collector(database);
  const ctx = context();
  const env = stagingEnv(database, dndr);
  const response = await worker.fetch(pageRequest('/project/example'), env, ctx);
  await ctx.settled();
  assert.equal(response.status, 422);
  assert.deepEqual(env.ANALYTICS_DB.prepared, []);
  assert.deepEqual(dndr.calls, []);
});

test('every public page is still recorded once and forwarded after the source row', async () => {
  for (const path of ELIGIBLE) {
    const database = openAnalyticsDb();
    const dndr = collector(database);
    const ctx = context();
    const response = await handlePageEvent(pageRequest(path), stagingEnv(database, dndr), ctx);
    await ctx.settled();
    assert.equal(response.status, 202, path);
    const rows = database.prepare('SELECT id, path FROM visitor_events').all();
    assert.deepEqual(rows.map((row) => row.path), [path], path);
    assert.equal(dndr.calls.length, 1, path);
    assert.equal(dndr.calls[0].rowsAtCall, 1, `${path} is forwarded only after it is stored`);
    assert.equal(dndr.calls[0].event.producerEventId, `visitor_events:${rows[0].id}`, path);
    assert.equal(dndr.calls[0].event.path, path, path);
  }
});

// The rule must match the route table: every eligible path renders a page and
// every ineligible page-like path renders the 404. This reads the server build.
const RENDERER_FILE = new URL('../../dist/server/entry-server.mjs', import.meta.url);

test('eligibility matches what the application renders', async () => {
  assert.ok(fs.existsSync(RENDERER_FILE), 'build the app first (npm run build --prefix apps/web)');
  const { renderPublicApplication } = await import('../../dist/server/entry-server.mjs');
  const publishedAt = 1;
  const payload = {
    contract: 1,
    publishedAt,
    count: Object.keys(completeSiteContent()).length,
    sections: Object.entries(completeSiteContent()).map(([id, data]) => ({ id, data, revision: 1, publishedAt })),
  };
  const isNotFound = (markup) => markup.includes('no such file or directory');
  for (const path of ELIGIBLE) {
    assert.equal(isNotFound(renderPublicApplication({ url: path, payload }).markup), false, `${path} renders a page`);
  }
  for (const path of INELIGIBLE.filter((path) => !/^\/(api|assets|boss)\b/.test(path))) {
    assert.equal(isNotFound(renderPublicApplication({ url: path, payload }).markup), true, `${path} renders the 404`);
  }
});
