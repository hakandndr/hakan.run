import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { completeSiteContent } from '../../test-fixtures/published-site.js';
import {
  REQUIRED_PUBLIC_SECTIONS,
  PublishedSiteError,
  createPublishedSiteSnapshot,
  loadPublishedSiteSnapshot,
} from './published-site.js';

const completeContent = () => {
  return completeSiteContent();
};

const responsePayload = (mutate = () => {}) => {
  const content = completeContent();
  mutate(content);
  const sections = REQUIRED_PUBLIC_SECTIONS.map((id) => ({
    id,
    revision: 1,
    publishedAt: 1,
    data: content[id],
  }));
  return { contract: 1, count: sections.length, publishedAt: 1, sections };
};

const expectCode = (run, code) => {
  assert.throws(run, (error) => error instanceof PublishedSiteError && error.code === code);
};

test('a complete APP_DB response creates one immutable PublishedSiteSnapshot', () => {
  const snapshot = createPublishedSiteSnapshot(responsePayload((content) => {
    content.hero.headingLine1 = 'PUBLISHED READY';
  }));

  assert.equal(snapshot.content.hero.headingLine1, 'PUBLISHED READY');
  assert.deepEqual(Object.keys(snapshot.content), REQUIRED_PUBLIC_SECTIONS);
  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.content.hero));
  assert.ok(Object.isFrozen(snapshot.content.portfolio.cards));
});

test('a missing section rejects the entire response', () => {
  const payload = responsePayload();
  payload.sections.pop();
  payload.count = payload.sections.length;
  expectCode(() => createPublishedSiteSnapshot(payload), 'missing_section');
});

test('a duplicate section rejects the entire response', () => {
  const payload = responsePayload();
  payload.sections[payload.sections.length - 1] = structuredClone(payload.sections[0]);
  expectCode(() => createPublishedSiteSnapshot(payload), 'duplicate_section');
});

test('an unknown section rejects the entire response', () => {
  const payload = responsePayload();
  payload.sections[payload.sections.length - 1].id = 'unsupported';
  expectCode(() => createPublishedSiteSnapshot(payload), 'unknown_section');
});

test('a malformed section rejects the entire response', () => {
  const payload = responsePayload();
  payload.sections.find(({ id }) => id === 'hero').data.headingLine1 = 42;
  expectCode(() => createPublishedSiteSnapshot(payload), 'invalid_section');
});

test('a forbidden legacy field rejects the entire response', () => {
  const payload = responsePayload();
  payload.sections.find(({ id }) => id === 'contact').data.formEndpoint = 'https://formspree.io/f/x';
  expectCode(() => createPublishedSiteSnapshot(payload), 'invalid_section');
});

test('renderer fields formerly supplied by source defaults are now contract gaps', () => {
  const cases = [
    ['hero', 'primaryButtonHref'],
    ['hero', 'profile'],
    ['about', 'chips'],
    ['cta', 'buttonHref'],
    ['footer', 'bottomSignature'],
  ];

  for (const [section, field] of cases) {
    const payload = responsePayload();
    delete payload.sections.find(({ id }) => id === section).data[field];
    expectCode(() => createPublishedSiteSnapshot(payload), 'invalid_section');
  }
});

test('portfolio presentation and navigation fields must be published', () => {
  for (const field of ['externalUrl', 'technology']) {
    const payload = responsePayload();
    delete payload.sections.find(({ id }) => id === 'portfolio').data.cards[0][field];
    expectCode(() => createPublishedSiteSnapshot(payload), 'invalid_section');
  }
});

test('empty and malformed response contracts are rejected', () => {
  expectCode(() => createPublishedSiteSnapshot({ contract: 1, count: 0, sections: [] }), 'empty_content');
  expectCode(() => createPublishedSiteSnapshot({ contract: 1, count: 2, sections: [] }), 'malformed_response');
  expectCode(() => createPublishedSiteSnapshot({ contract: 2, count: 0, sections: [] }), 'unsupported_contract');
  const missingMetadata = responsePayload();
  delete missingMetadata.sections[0].revision;
  expectCode(() => createPublishedSiteSnapshot(missingMetadata), 'malformed_response');
  const inconsistentPublication = responsePayload();
  inconsistentPublication.publishedAt = 2;
  expectCode(() => createPublishedSiteSnapshot(inconsistentPublication), 'malformed_response');
});

test('transport, HTTP, content-type and invalid JSON failures stay errors', async () => {
  await assert.rejects(
    loadPublishedSiteSnapshot(async () => { throw new TypeError('offline'); }),
    (error) => error.code === 'transport_failure',
  );
  await assert.rejects(
    loadPublishedSiteSnapshot(async () => ({ ok: false, status: 503, redirected: false })),
    (error) => error.code === 'http_503',
  );
  await assert.rejects(
    loadPublishedSiteSnapshot(async () => ({
      ok: true,
      status: 200,
      redirected: false,
      headers: { get: () => 'text/html' },
    })),
    (error) => error.code === 'invalid_content_type',
  );
  await assert.rejects(
    loadPublishedSiteSnapshot(async () => ({
      ok: true,
      status: 200,
      redirected: false,
      headers: { get: () => 'application/json' },
      json: async () => { throw new SyntaxError('bad json'); },
    })),
    (error) => error.code === 'invalid_json',
  );
});

test('the public renderer and bootstrap have no context, fallback, or merge authority', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  const publicSources = [
    read('../public/PublicBootstrap.jsx'),
    read('../Application.jsx'),
    read('../App.jsx'),
    read('../public/PublicHome.jsx'),
    read('../public/PublicRenderer.jsx'),
  ].join('\n');

  assert.doesNotMatch(publicSources, /from\s+['"][^'"]*content(?:\.js)?['"]/);
  assert.doesNotMatch(publicSources, /ContentContext|ContentProvider|mergeSections|siteContent/);
  assert.doesNotMatch(publicSources, /sessionStorage|TerminalLoader|setTimeout|setInterval/);
  assert.match(read('../public/PublicBootstrap.jsx'), /loadPublishedSiteSnapshot/);
  assert.match(read('../public/PublicBootstrap.jsx'), /content-source\/visual-tokens/);
});

test('public and Boss entry trees are dynamically isolated', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  const main = read('../main.jsx');
  const app = read('../App.jsx');
  const application = read('../Application.jsx');

  assert.match(main, /import\('\.\/public\/PublicBootstrap\.jsx'\)/);
  assert.match(main, /import\('\.\/boss\/BossApplication\.jsx'\)/);
  assert.doesNotMatch(app + application, /@\/boss\//);
});

test('Boss preview validates an explicit snapshot without fallback merging', () => {
  const preview = readFileSync(new URL('../boss/PreviewPage.jsx', import.meta.url), 'utf8');
  assert.match(preview, /createPublishedSiteSnapshot/);
  assert.doesNotMatch(preview, /ContentContext|ContentProvider|content\.js|siteContent|mergeSections/);
});

test('the neutral document shell contains no real editable content', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /<div id="root"><\/div>/);
  assert.doesNotMatch(html, /data-public-bootstrap="loading"|bootstrap-shell|skeleton|placeholder/i);
  assert.doesNotMatch(html, /BUILD\. DEPLOY|QA Automation|MY EXPERTISE|Portfolio|About|Hakan Dundar/);
});
