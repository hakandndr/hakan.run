import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(app, 'notes');
const catalogPath = path.join(app, 'src/notes/catalog.js');
const manifestPath = path.join(app, 'src/notes/manifest.js');
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export const readNotes = () => {
  const files = fs.readdirSync(source).filter((name) => name.endsWith('.md')).sort();
  if (files.length < 5) throw new Error('Engineering Notes needs at least five source articles');
  const notes = files.map((file) => {
    const slug = file.slice(0, -3);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid note slug: ${slug}`);
    const raw = fs.readFileSync(path.join(source, file), 'utf8').replace(/\r\n/g, '\n');
    const match = raw.match(/^---\n([\s\S]*?)\n---\n+([\s\S]*?)\s*$/);
    if (!match) throw new Error(`Invalid note front matter: ${file}`);
    const pairs = match[1].split('\n').map((line) => {
      const separator = line.indexOf(': ');
      if (separator < 1) throw new Error(`Invalid field in ${file}: ${line}`);
      return [line.slice(0, separator), line.slice(separator + 2)];
    });
    const fields = Object.fromEntries(pairs);
    const keys = Object.keys(fields);
    if (pairs.length !== 5 || keys.length !== 5 || ['title', 'deck', 'date', 'topic', 'project'].some((key) => !fields[key])) {
      throw new Error(`Note requires title, deck, date, topic and project only: ${file}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date) || new Date(`${fields.date}T00:00:00Z`).toISOString().slice(0, 10) !== fields.date) {
      throw new Error(`Invalid note date: ${file}`);
    }
    const blocks = match[2].trim().split(/\n\s*\n/);
    const html = blocks.map((block) => {
      if (block.startsWith('## ')) return `<h2>${escapeHtml(block.slice(3).trim())}</h2>`;
      if (block.includes('\n')) throw new Error(`Unsupported Markdown block in ${file}`);
      return `<p>${escapeHtml(block.trim())}</p>`;
    }).join('\n');
    return { slug, ...fields, html };
  });
  if (new Set(notes.map((note) => note.title)).size !== notes.length) throw new Error('Duplicate note title');
  return notes.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
};

export const writeNotesCatalog = (notes) => {
  fs.mkdirSync(path.dirname(catalogPath), { recursive: true });
  fs.writeFileSync(catalogPath, `// Generated from apps/web/notes/*.md by tools/notes.js.\nexport const NOTES = ${JSON.stringify(notes, null, 2)};\n\nexport const getNote = (slug) => NOTES.find((note) => note.slug === slug) ?? null;\n`, 'utf8');
  fs.writeFileSync(manifestPath, `// Generated from apps/web/notes/*.md by tools/notes.js.\nexport const NOTE_SLUGS = ${JSON.stringify(notes.map((note) => note.slug), null, 2)};\nexport const isKnownNoteSlug = (slug) => NOTE_SLUGS.includes(slug);\n`, 'utf8');
};

const metadata = (template, title, description, pathname) => template
  .replace('<title>hakan.run</title>', `<title>${escapeHtml(title)} | Hakan Dundar</title>`)
  .replace('<link rel="canonical" href="https://hakan.run/" />', `<link rel="canonical" href="https://hakan.run${pathname}" />\n  <meta name="description" content="${escapeHtml(description)}" />\n  <meta property="og:title" content="${escapeHtml(title)}" />\n  <meta property="og:description" content="${escapeHtml(description)}" />\n  <meta property="og:url" content="https://hakan.run${pathname}" />`);

const staticLink = (note) => `<li><time datetime="${note.date}">${note.date}</time><a href="/notes/${note.slug}">${escapeHtml(note.title)}</a><p>${escapeHtml(note.deck)}</p></li>`;
const staticArticle = (note) => `<main class="notes-page"><article class="notes-article"><a href="/notes">← Back to Notes</a><p class="notes-context">${escapeHtml(note.topic)} · ${escapeHtml(note.project)}</p><h1>${escapeHtml(note.title)}</h1><p>${escapeHtml(note.deck)}</p><time datetime="${note.date}">${note.date}</time><div class="notes-body">${note.html}</div><p>— Hakan</p></article></main>`;
const staticIndex = (notes) => `<main class="notes-page"><section class="notes-article"><h1>Engineering Notes</h1><p>Engineering decisions, failures and operational lessons from systems I have built.</p><ul>${notes.map(staticLink).join('')}</ul></section></main>`;
const prerenderStyle = '<style>.notes-page{min-height:100vh;background:#090909;color:#eee;padding:9rem 1.5rem 5rem}.notes-article{max-width:48rem;margin:auto;font:1.125rem/1.8 system-ui,sans-serif}.notes-article h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.15}.notes-article h2{font-size:1.5rem;margin-top:2.5rem}.notes-article p{margin:1.25rem 0}.notes-article a{color:#57b8ff}.notes-article li{margin:2rem 0}.notes-article li time{display:block;font:0.75rem/1.5 monospace}.notes-article time,.notes-context{color:#aaa}.notes-article .notes-body{margin-top:2.5rem}</style>';

export const writeNotesArtifact = (output, mode, notes) => {
  const template = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
  const pages = [{ pathname: '/notes', title: 'Engineering Notes', description: 'Engineering decisions, failures and operational lessons from systems I have built.', body: staticIndex(notes) },
    ...notes.map((note) => ({ pathname: `/notes/${note.slug}`, title: note.title, description: note.deck, body: staticArticle(note) }))];
  for (const page of pages) {
    // Cloudflare's default HTML handling serves file.html at /file without a
    // redirect. Directory index files would canonicalize to a trailing slash.
    const target = path.join(output, `${page.pathname.slice(1)}.html`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const document = metadata(template, page.title, page.description, page.pathname)
      .replace('</head>', `  ${prerenderStyle}\n</head>`)
      .replace('<div id="root"></div>', `<div id="root">${page.body}</div>`);
    fs.writeFileSync(target, document, 'utf8');
  }
  if (mode !== 'staging') {
    const sitemap = path.join(output, 'sitemap.xml');
    const xml = fs.readFileSync(sitemap, 'utf8');
    const entries = pages.map(({ pathname }) => `  <url><loc>https://hakan.run${pathname}</loc></url>`).join('\n');
    fs.writeFileSync(sitemap, xml.replace('</urlset>', `${entries}\n</urlset>`), 'utf8');
  }
  return pages.length;
};
