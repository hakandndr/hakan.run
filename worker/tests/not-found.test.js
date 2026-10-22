// HTTP contract for requests that match no page.
//
// Static Assets answer files. Everything else reaches the Worker
// (not_found_handling "none"), which must return a real 404 for anything that
// is not a page, never a 200 copy of the application shell.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../index.js';
import { completeSiteContent } from '../../apps/web/test-fixtures/published-site.js';

const SHELL_FILE = new URL('../../dist/apps/web/index.html', import.meta.url);
const RENDERER_FILE = new URL('../../dist/server/entry-server.mjs', import.meta.url);
const built = fs.existsSync(SHELL_FILE) && fs.existsSync(RENDERER_FILE);
const shell = built ? fs.readFileSync(SHELL_FILE, 'utf8') : '';

// Static Assets with not_found_handling "none": "/" is the shell, nothing else
// exists here, and a miss is a 404 rather than a fallback.
const assets = (seen = []) => ({
  fetch: async (request) => {
    const { pathname } = new URL(request.url);
    seen.push(pathname);
    if (pathname === '/') return new Response(shell, { status: 200, headers: { 'content-type': 'text/html' } });
    return new Response('Not Found', { status: 404 });
  },
});
const rows = Object.entries(completeSiteContent()).map(([section, data]) => ({
  section, published_data: JSON.stringify(data), published_revision: 1, published_at: 1,
}));
const database = () => ({ prepare: () => ({ bind: () => ({ all: async () => ({ results: rows }) }) }) });
const unreadableDatabase = () => ({ prepare: () => { throw new Error('APP_DB must not be read'); } });
const failingDatabase = () => ({ prepare: () => ({ bind: () => ({ all: async () => { throw new Error('d1 unavailable'); } }) }) });
const get = (path, env, init) => worker.fetch(new Request(`https://hakan.run${path}`, init), env, {});
const head = (html) => html.slice(0, html.indexOf('</head>'));

test('an unknown page-like path is the site 404 document, rendered and hydratable', { skip: !built }, async () => {
  for (const path of ['/nonexistent-path', '/project/full-stack-development', '/admin', '/contact/extra', '/notes/not-a-real-note', '/notes/a-write-path-for-a-mostly-static-site/extra']) {
    const response = await get(path, { ASSETS: assets(), APP_DB: database() });
    assert.equal(response.status, 404, path);
    assert.match(response.headers.get('content-type'), /^text\/html/, path);
    const html = await response.text();
    assert.match(html, /<title data-react-helmet="true">404 — Page Not Found \| Hakan Dundar<\/title>/, path);
    assert.match(html, /<meta name="robots" content="noindex" \/>/, path);
    assert.doesNotMatch(head(html), /rel="canonical"|property="og:|name="twitter:/, path);
    assert.match(html, /<script id="published-payload" type="application\/json">/, path);
    // The NotFound route is the first paint: visible without JavaScript, and
    // naming the requested path exactly as the browser router will.
    assert.match(html, /<h1[^>]*>4<span class="text-accent-purple">0<\/span>4<\/h1>/, path);
    assert.ok(html.includes(`<span>cd <!-- -->${path}</span>`), path);
    assert.doesNotMatch(html.slice(html.indexOf('<div id="root">')), /opacity:0/, path);
  }
});

test('the 404 document stays a 404 when APP_DB is unavailable', { skip: !built }, async () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    for (const env of [{ ASSETS: assets(), APP_DB: failingDatabase() }, { ASSETS: assets() }]) {
      const response = await get('/nonexistent-path', env);
      assert.equal(response.status, 404);
      const html = await response.text();
      assert.match(html, /<meta name="robots" content="noindex" \/>/);
      assert.doesNotMatch(head(html), /rel="canonical"/);
    }
  } finally {
    console.error = originalError;
  }
});

test('a valid page degrades to its shell with 200, never a 404, when APP_DB fails', { skip: !built }, async () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    for (const path of ['/', '/contact', '/card']) {
      const response = await get(path, { ASSETS: assets(), APP_DB: failingDatabase() });
      assert.equal(response.status, 200, path);
    }
  } finally {
    console.error = originalError;
  }
});

test('HEAD of an unknown path is a bodyless 404', { skip: !built }, async () => {
  const response = await get('/nonexistent-path', { ASSETS: assets(), APP_DB: database() }, { method: 'HEAD' });
  assert.equal(response.status, 404);
  assert.equal(await response.text(), '');
});

test('a missing file is a plain 404 without rendering or a database read', async () => {
  for (const path of ['/assets/nonexistent-file.js', '/favicon.ico', '/wp-login.php', '/.env']) {
    const seen = [];
    const response = await get(path, { ASSETS: assets(seen), APP_DB: unreadableDatabase() });
    assert.equal(response.status, 404, path);
    assert.doesNotMatch(response.headers.get('content-type') ?? '', /text\/html/, path);
    assert.deepEqual(seen, [path], path);
  }
});

test('a trailing slash on a public document redirects to its canonical address', async () => {
  for (const [path, location] of [['/contact/', 'https://hakan.run/contact'], ['/card/?ref=qr', 'https://hakan.run/card?ref=qr']]) {
    const response = await get(path, { ASSETS: assets(), APP_DB: unreadableDatabase() });
    assert.equal(response.status, 308, path);
    assert.equal(response.headers.get('location'), location, path);
  }
});

test('unknown API paths keep their JSON 404', async () => {
  const api = await get('/api/nope', { ASSETS: assets(), APP_DB: unreadableDatabase() });
  assert.equal(api.status, 404);
  assert.match(api.headers.get('content-type'), /application\/json/);
});

test('an unknown note is the site 404 document, also for HEAD and without APP_DB', { skip: !built }, async () => {
  const head404 = await get('/notes/not-a-real-note', { ASSETS: assets(), APP_DB: unreadableDatabase() }, { method: 'HEAD' });
  assert.equal(head404.status, 404);
  assert.equal(await head404.text(), '');
  const post = await get('/notes/not-a-real-note', { ASSETS: assets(), APP_DB: unreadableDatabase() }, { method: 'POST' });
  assert.equal(post.status, 405);
  const originalError = console.error;
  console.error = () => {};
  try {
    const seen = [];
    const degraded = await get('/notes/not-a-real-note', { ASSETS: assets(seen), APP_DB: failingDatabase() });
    assert.equal(degraded.status, 404);
    const html = await degraded.text();
    assert.match(html, /<meta name="robots" content="noindex" \/>/);
    assert.doesNotMatch(head(html), /rel="canonical"/);
    // Only the application shell was fetched, never the requested path.
    assert.deepEqual(seen, ['/']);
  } finally {
    console.error = originalError;
  }
});

test('the Boss shell is the application shell, fetched explicitly', async () => {
  // Without Access configuration the request is refused before any shell fetch.
  const seen = [];
  const refused = await get('/boss/analytics', { ASSETS: assets(seen) });
  assert.equal(refused.status, 403);
  assert.deepEqual(seen, []);
});
