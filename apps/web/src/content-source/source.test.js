// Four outcomes, and they must stay four.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTENT_STATE,
  interpretContentResponse,
  mergeSections,
  loadContent,
} from './source.js';

const answer = (payload, overrides = {}) => ({
  ok: true,
  status: 200,
  redirected: false,
  contentType: 'application/json; charset=utf-8',
  payload,
  ...overrides,
});

const published = (sections) => ({
  contract: 1,
  count: sections.length,
  publishedAt: 1,
  sections,
});

// --- ready ------------------------------------------------------------------

test('published sections are content', () => {
  const result = interpretContentResponse(
    answer(published([{ id: 'hero', revision: 1, publishedAt: 1, data: { headingLine1: 'RUN.' } }])),
  );
  assert.equal(result.state, CONTENT_STATE.ready);
  assert.equal(result.sections.length, 1);
});

// --- empty ------------------------------------------------------------------

test('nothing published is empty, and empty is not a failure', () => {
  const result = interpretContentResponse(answer(published([])));
  assert.equal(result.state, CONTENT_STATE.empty);
  assert.equal(result.reason, null);
});

// --- failed -----------------------------------------------------------------

test('a server error is a failure, not an empty site', () => {
  const result = interpretContentResponse(answer(undefined, { ok: false, status: 500 }));
  assert.equal(result.state, CONTENT_STATE.failed);
  assert.equal(result.reason, 'http_500');
});

test('an HTML answer is a failure — the asset layer answered, not the Worker', () => {
  const result = interpretContentResponse(
    answer('<!doctype html>', { contentType: 'text/html; charset=utf-8' }),
  );
  assert.equal(result.state, CONTENT_STATE.failed);
  assert.equal(result.reason, 'not_json');
});

test('a redirect is a failure, whatever it redirected to', () => {
  const result = interpretContentResponse(answer(published([]), { redirected: true }));
  assert.equal(result.state, CONTENT_STATE.failed);
  assert.equal(result.reason, 'redirected');
});

test('a transport failure is a failure', async () => {
  const result = await loadContent(async () => {
    throw new TypeError('Failed to fetch');
  });
  assert.equal(result.state, CONTENT_STATE.failed);
  assert.equal(result.reason, 'transport');
});

test('a body that will not parse is a failure, not empty', async () => {
  const result = await loadContent(async () => ({
    ok: true,
    status: 200,
    redirected: false,
    headers: { get: () => 'application/json' },
    json: async () => {
      throw new SyntaxError('Unexpected token');
    },
  }));
  assert.equal(result.state, CONTENT_STATE.failed);
});

// --- malformed contract -----------------------------------------------------

test('an unknown contract version is refused rather than guessed at', () => {
  const result = interpretContentResponse(answer({ contract: 2, count: 0, sections: [] }));
  assert.equal(result.state, CONTENT_STATE.failed);
  assert.equal(result.reason, 'unsupported_contract');
});

test('a count that disagrees with the array is an integrity failure', () => {
  const result = interpretContentResponse(
    answer({ contract: 1, count: 5, sections: [{ id: 'hero', data: {} }] }),
  );
  assert.equal(result.state, CONTENT_STATE.failed);
  assert.equal(result.reason, 'malformed');
});

test('a section whose data cannot be overlaid fails the whole response', () => {
  for (const data of [null, 'text', 42, ['a']]) {
    const result = interpretContentResponse(
      answer({ contract: 1, count: 1, sections: [{ id: 'hero', data }] }),
    );
    assert.equal(result.state, CONTENT_STATE.failed, `expected ${JSON.stringify(data)} to fail`);
  }
});

test('one bad section is never partially applied alongside good ones', () => {
  const result = interpretContentResponse(
    answer({
      contract: 1,
      count: 2,
      sections: [
        { id: 'hero', data: { ok: true } },
        { id: 'footer', data: 'not an object' },
      ],
    }),
  );
  assert.equal(result.state, CONTENT_STATE.failed);
  assert.deepEqual(result.sections, []);
});

test('every failure carries no sections, so nothing can be merged from one', () => {
  const failures = [
    answer(undefined, { ok: false, status: 503 }),
    answer('<html>', { contentType: 'text/html' }),
    answer(published([{ id: 'hero', data: 1 }])),
    answer({ contract: 9, sections: [] }),
  ];
  for (const response of failures) {
    const result = interpretContentResponse(response);
    assert.equal(result.state, CONTENT_STATE.failed);
    assert.deepEqual(result.sections, []);
  }
});

// --- merge semantics --------------------------------------------------------

test('a published section replaces that section entirely, and no other', () => {
  const base = { hero: { a: 1, b: 2 }, footer: { c: 3 } };
  const merged = mergeSections(base, [{ id: 'hero', data: { a: 9 } }]);

  assert.deepEqual(merged.hero, { a: 9 }, 'shallow by section, not deep-merged');
  assert.deepEqual(merged.footer, { c: 3 }, 'untouched sections keep the fallback');
});

test('merging nothing returns the base object unchanged', () => {
  const base = { hero: { a: 1 } };
  assert.equal(mergeSections(base, []), base);
});

test('the base is not mutated, so a failed load cannot corrupt what is rendered', () => {
  const base = { hero: { a: 1 } };
  mergeSections(base, [{ id: 'hero', data: { a: 2 } }]);
  assert.deepEqual(base, { hero: { a: 1 } });
});

// --- The boundary the content path must not cross ---------------------------

test('nothing on the public content path can reach Supabase', async () => {
  const { readFileSync, readdirSync, statSync } = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

  const files = (directory) =>
    readdirSync(directory).flatMap((entry) => {
      const full = path.join(directory, entry);
      if (statSync(full).isDirectory()) return files(full);
      return /\.(js|jsx)$/.test(entry) && !entry.endsWith('.test.js') ? [full] : [];
    });

  // Comments here name the thing they forbid, so they are stripped first: the
  // question is what the bundle can reach, not what it documents.
  const withoutComments = (contents) =>
    contents.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const reaches = /@supabase\/|from\s+['"][^'"]*supabase|\.supabase\.co/i;

  const importers = files(srcRoot)
    .filter((file) => reaches.test(withoutComments(readFileSync(file, 'utf8'))))
    .map((file) => path.relative(srcRoot, file).split(path.sep).join('/'))
    .sort();

  // Two files, and only two: the client module itself and the legacy Admin
  // surface that authenticates against it. Neither is on the public content
  // path. Removing them belongs to the legacy `/control-room` removal (D-019);
  // until then this list is the boundary, and a third entry means the content
  // path — or something new — has reacquired a production dependency.
  assert.deepEqual(importers, ['lib/supabase.js', 'pages/Admin.jsx']);
});

test('the content context reads the API and nothing else', async () => {
  const { readFileSync } = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const here = path.dirname(fileURLToPath(import.meta.url));

  const context = readFileSync(path.join(here, '../contexts/ContentContext.jsx'), 'utf8');
  assert.ok(context.includes("from '@/content-source/source'"), 'the context must load content through the source module');
  assert.ok(!/from\s+['"][^'"]*supabase/.test(context), 'the context must not import a Supabase client');
});
