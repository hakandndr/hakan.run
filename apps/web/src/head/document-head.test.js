import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { applyDocumentHead, publicCanonicalUrl, SOCIAL_IMAGE } from './document-head.js';

const template = [
  '<head>',
  '  <title>hakan.run</title>',
  '  <link rel="canonical" href="https://hakan.run/" />',
  '  <meta name="robots" content="noindex, nofollow" />',
  '</head>',
].join('\n');
const head = {
  title: '<title data-react-helmet="true">Hakan Dundar</title>',
  meta: '<meta data-react-helmet="true" name="description" content="About"/><meta data-react-helmet="true" property="og:title" content="Hakan Dundar"/>',
};
const count = (html, pattern) => (html.match(pattern) ?? []).length;

test('the route head replaces the static title and follows the canonical link', () => {
  const html = applyDocumentHead(template, { head, canonical: 'https://hakan.run/contact' });
  assert.equal(count(html, /<title\b/g), 1);
  assert.match(html, /<title data-react-helmet="true">Hakan Dundar<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/hakan.run\/contact" \/>\n {2}<meta data-react-helmet="true" name="description" content="About"\/>\n {2}<meta data-react-helmet="true" property="og:title"/);
  assert.equal(count(html, /rel="canonical"/g), 1);
});

test('the build-owned robots directive is left exactly as it was', () => {
  const html = applyDocumentHead(template, { head, canonical: 'https://hakan.run/' });
  assert.equal(count(html, /name="robots"/g), 1);
  assert.match(html, /<meta name="robots" content="noindex, nofollow" \/>/);
});

test('composing a prebuilt document again replaces its route tags instead of adding a second set', () => {
  const prebuilt = applyDocumentHead(template, { head, canonical: 'https://hakan.run/notes' });
  const next = { title: '<title data-react-helmet="true">Notes</title>', meta: '<meta data-react-helmet="true" property="og:title" content="Notes"/>' };
  const html = applyDocumentHead(prebuilt, { head: next, canonical: 'https://hakan.run/notes' });
  assert.equal(count(html, /data-react-helmet/g), 2);
  assert.doesNotMatch(html, /content="About"|Hakan Dundar/);
});

test('a route without a Helmet title keeps the document title', () => {
  const html = applyDocumentHead(template, { head: { title: '<title data-react-helmet="true"></title>', meta: '' }, canonical: 'https://hakan.run/' });
  assert.match(html, /<title>hakan.run<\/title>/);
  assert.equal(count(html, /data-react-helmet/g), 0);
});

test('a document that is not a page names no canonical and is not indexable', () => {
  const production = template.replace('noindex, nofollow', 'index, follow');
  const html = applyDocumentHead(production, { head, canonical: null, indexable: false });
  assert.equal(count(html, /rel="canonical"/g), 0);
  assert.match(html, /<meta name="robots" content="noindex" \/>/);
  assert.equal(count(html, /name="robots"/g), 1);
  assert.match(html, /<title data-react-helmet="true">Hakan Dundar<\/title>\n {2}<meta data-react-helmet="true" name="description"/);
  // Staging already forbids indexing more strictly; that directive stays.
  assert.match(applyDocumentHead(template, { head, canonical: null, indexable: false }), /<meta name="robots" content="noindex, nofollow" \/>/);
});

test('the canonical href is escaped', () => {
  const html = applyDocumentHead(template, { head, canonical: 'https://hakan.run/"><script>' });
  assert.match(html, /href="https:\/\/hakan.run\/&quot;&gt;&lt;script&gt;"/);
});

test('a document without a title or canonical link is refused rather than guessed', () => {
  assert.throws(() => applyDocumentHead('<head></head>', { head, canonical: 'https://hakan.run/' }), /document_title_missing/);
  assert.throws(() => applyDocumentHead('<head><title>x</title></head>', { head, canonical: 'https://hakan.run/' }), /document_canonical_missing/);
});

test('public canonical URLs and the social image are absolute production URLs', () => {
  assert.equal(publicCanonicalUrl('/'), 'https://hakan.run/');
  assert.equal(publicCanonicalUrl('/notes/x'), 'https://hakan.run/notes/x');
  assert.equal(SOCIAL_IMAGE.url, 'https://hakan.run/og-image.png');
});

test('the declared social image size is the size of the published asset', () => {
  // PNG stores width and height as big-endian integers in the IHDR chunk.
  const png = fs.readFileSync(new URL('../../public/og-image.png', import.meta.url));
  assert.equal(png.subarray(1, 4).toString('latin1'), 'PNG');
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [SOCIAL_IMAGE.width, SOCIAL_IMAGE.height]);
});
