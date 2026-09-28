import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOTES } from '../src/notes/catalog.js';
import { NOTE_SLUGS } from '../src/notes/manifest.js';
import { readNotes } from './notes.js';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(app, '../../dist/apps/web');

test('source Markdown and generated catalogue contain the same five notes', () => {
  const source = readNotes();
  assert.deepEqual(NOTES, source);
  assert.deepEqual(NOTE_SLUGS, source.map((note) => note.slug));
  assert.equal(source.length, 5);
  for (const note of source) {
    assert.match(note.html, /^<(p|h2)>/);
    assert.doesNotMatch(note.html, /notes\.dndr\.net|<script|<iframe/i);
  }
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
