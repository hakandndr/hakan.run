import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FEATURED_NOTES, NOTES } from '../src/notes/catalog.js';
import { NOTE_SLUGS } from '../src/notes/manifest.js';
import { readNotes } from './notes.js';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(app, '../../dist/apps/web');

test('source Markdown and generated catalogue contain the same eleven notes', () => {
  const source = readNotes();
  assert.deepEqual(NOTES, source);
  assert.deepEqual(NOTE_SLUGS, source.map((note) => note.slug));
  assert.equal(source.length, 11);
  assert.equal(new Set(NOTE_SLUGS).size, NOTE_SLUGS.length);
  for (const note of source) {
    assert.match(note.html, /^<(p|h2)>/);
    assert.doesNotMatch(note.html, /notes\.dndr\.net|<script|<iframe/i);
    for (const [, href] of note.html.matchAll(/<a href="([^"]*)"/g)) assert.match(href, /^https:\/\//);
  }
});

test('the five existing note URLs are preserved', () => {
  for (const slug of [
    'a-write-path-for-a-mostly-static-site',
    'moving-a-live-static-site-to-the-edge-without-moving-everything',
    'security-headers-on-pages-the-worker-never-sees',
    'reachable-is-not-current',
    'two-languages-not-one-translation',
  ]) assert.ok(NOTE_SLUGS.includes(slug), slug);
});

test('notes are ordered by their single date, newest first', () => {
  const dates = NOTES.map((note) => note.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
  for (const note of NOTES) assert.deepEqual(Object.keys(note).filter((key) => /date|updated|published|created/i.test(key)), ['date']);
});

test('the homepage selection is three source-controlled notes in a fixed order', () => {
  assert.deepEqual(FEATURED_NOTES.map((note) => note.slug), [
    'moving-a-live-static-site-to-the-edge-without-moving-everything',
    'a-write-path-for-a-mostly-static-site',
    'why-the-status-page-ignores-single-failed-probes',
  ]);
});

test('inline code and https links render escaped', () => {
  const html = NOTES.map((note) => note.html).join('\n');
  assert.match(html, /<code>run_worker_first: \[&quot;\/\*&quot;\]<\/code>/);
  assert.match(html, /<a href="https:\/\/github\.com\/hakandndr\/web-engineering-playbook">web-engineering-playbook<\/a>/);
  assert.doesNotMatch(html, /`|\]\(/);
});

test('built Notes pages carry article content, title, canonical and production sitemap entries', { skip: !fs.existsSync(output) }, () => {
  const sitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
  for (const note of NOTES) {
    const url = `https://hakan.run/notes/${note.slug}`;
    const html = fs.readFileSync(path.join(output, 'notes', `${note.slug}.html`), 'utf8');
    assert.match(html, new RegExp(`<title>${note.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\| Hakan Dundar</title>`));
    assert.ok(html.includes(`<link rel="canonical" href="${url}" />`));
    assert.ok(html.includes(note.html));
    assert.ok(sitemap.includes(`<loc>${url}</loc>`));
  }
  assert.ok(sitemap.includes('<loc>https://hakan.run/notes</loc>'));
});
