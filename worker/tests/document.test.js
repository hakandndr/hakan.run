import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.js';
import { composeDocument, serveDocument } from '../public/document.js';

const payload = {
  contract: 1,
  count: 2,
  publishedAt: 1,
  sections: [
    { id: 'colors', revision: 1, publishedAt: 1, data: { accentPurple: '#57B8FF', background: '#090909', cardBackground: '#111112', heroOverlay: '#000000' } },
    { id: 'typography', revision: 1, publishedAt: 1, data: { headingFont: 'mono', bodySize: 'md', sectionSpacing: 'normal' } },
  ],
};
const template = '<html lang="en" style="background-color:#090909"><head></head><body style="background-color:#090909"><div id="root"></div><script type="module" src="/a.js"></script></body></html>';

test('composition fills the empty root, writes theme tokens and embeds the payload', () => {
  const html = composeDocument(template, { markup: '<main>page</main>', payload });
  assert.ok(html.includes('<div id="root"><main>page</main></div>'));
  assert.match(html, /<html lang="en" style="background-color:#090909;--color-accent-rgb:87 184 255;--color-bg:#090909;/);
  assert.match(html, /<body style="background-color:#090909" data-heading-font="mono" data-body-size="md" data-spacing="normal">/);
  const embedded = html.match(/<script id="published-payload" type="application\/json">([^]*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(embedded), payload);
});

test('composition replaces the static Notes body between its outlet markers', () => {
  const notes = template.replace('<div id="root"></div>', '<div id="root"><!--ssr-fallback--><article>static</article><!--/ssr-fallback--></div>');
  const html = composeDocument(notes, { markup: '<main>live</main>', payload });
  assert.ok(html.includes('<div id="root"><main>live</main></div>'));
  assert.doesNotMatch(html, /ssr-fallback|static/);
});

test('embedded payload cannot close its script element', () => {
  const hostile = { ...payload, note: `</script><script>alert(1)</script>${String.fromCharCode(0x2028)}` };
  const html = composeDocument(template, { markup: '', payload: hostile });
  const embedded = html.match(/<script id="published-payload" type="application\/json">([^]*?)<\/script>/)[1];
  assert.doesNotMatch(embedded, /<\/?script/i);
  assert.deepEqual(JSON.parse(embedded), hostile);
});

test('a document without an application outlet is refused rather than guessed', () => {
  assert.throws(() => composeDocument('<html style=""><body></body></html>', { markup: 'x', payload }), /document_outlet_missing/);
});

test('without APP_DB the static asset is served unchanged', async () => {
  const asset = new Response(template, { headers: { 'content-type': 'text/html' } });
  const response = await serveDocument(new Request('https://hakan.run/'), { ASSETS: { fetch: async () => asset } });
  assert.equal(response, asset);
});

test('a failed content read falls back to the static document', async () => {
  const env = {
    ASSETS: { fetch: async () => new Response(template, { headers: { 'content-type': 'text/html' } }) },
    APP_DB: { prepare: () => ({ bind: () => ({ all: async () => { throw new Error('d1 unavailable'); } }) }) },
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await serveDocument(new Request('https://hakan.run/notes'), env);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), template);
  } finally {
    console.error = originalError;
  }
});

test('public documents are routed through the document renderer', async () => {
  const seen = [];
  const env = { ASSETS: { fetch: async (request) => { seen.push(new URL(request.url).pathname); return new Response('asset', { status: 200 }); } } };
  for (const path of ['/', '/contact', '/card']) {
    const response = await worker.fetch(new Request(`https://hakan.run${path}`), env, {});
    assert.equal(response.status, 200, path);
  }
  assert.deepEqual(seen, ['/', '/contact', '/card']);
  const post = await worker.fetch(new Request('https://hakan.run/', { method: 'POST' }), env, {});
  assert.equal(post.status, 405);
});
