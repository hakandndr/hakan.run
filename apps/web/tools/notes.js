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

const REQUIRED = ['title', 'deck', 'date', 'topic', 'project'];
const FIELDS = [...REQUIRED, 'featured'];

// Articles are prose: paragraphs and section headings, with inline code and
// https links as the only inline syntax. Anything else fails the build.
const inline = (text, file) => {
  const plain = (value) => {
    if (/`|\]\(/.test(value)) throw new Error(`Unsupported inline Markdown in ${file}`);
    return escapeHtml(value);
  };
  let html = '';
  let last = 0;
  for (const match of text.matchAll(/`([^`]+)`|\[([^\]]+)\]\((https:\/\/[^\s()]+)\)/g)) {
    html += plain(text.slice(last, match.index));
    html += match[1] === undefined
      ? `<a href="${escapeHtml(match[3])}">${escapeHtml(match[2])}</a>`
      : `<code>${escapeHtml(match[1])}</code>`;
    last = match.index + match[0].length;
  }
  return html + plain(text.slice(last));
};

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
    if (keys.length !== pairs.length || keys.some((key) => !FIELDS.includes(key)) || REQUIRED.some((key) => !fields[key])) {
      throw new Error(`Note requires title, deck, date, topic and project, with optional featured: ${file}`);
    }
    if ('featured' in fields) {
      if (!/^[1-3]$/.test(fields.featured)) throw new Error(`Invalid featured position: ${file}`);
      fields.featured = Number(fields.featured);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date) || new Date(`${fields.date}T00:00:00Z`).toISOString().slice(0, 10) !== fields.date) {
      throw new Error(`Invalid note date: ${file}`);
    }
    const blocks = match[2].trim().split(/\n\s*\n/);
    const html = blocks.map((block) => {
      if (block.includes('\n')) throw new Error(`Unsupported Markdown block in ${file}`);
      if (block.startsWith('## ')) return `<h2>${inline(block.slice(3).trim(), file)}</h2>`;
      return `<p>${inline(block.trim(), file)}</p>`;
    }).join('\n');
    return { slug, ...fields, html };
  });
  if (new Set(notes.map((note) => note.title)).size !== notes.length) throw new Error('Duplicate note title');
  const featured = notes.filter((note) => note.featured).map((note) => note.featured).sort();
  if (featured.join() !== '1,2,3') throw new Error('Exactly three notes must be featured at positions 1, 2 and 3');
  return notes.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
};

export const writeNotesCatalog = (notes) => {
  fs.mkdirSync(path.dirname(catalogPath), { recursive: true });
  fs.writeFileSync(catalogPath, `// Generated from apps/web/notes/*.md by tools/notes.js.\nexport const NOTES = ${JSON.stringify(notes, null, 2)};\n\nexport const FEATURED_NOTES = NOTES.filter((note) => note.featured).sort((a, b) => a.featured - b.featured);\n\nexport const getNote = (slug) => NOTES.find((note) => note.slug === slug) ?? null;\n`, 'utf8');
  fs.writeFileSync(manifestPath, `// Generated from apps/web/notes/*.md by tools/notes.js.\nexport const NOTE_SLUGS = ${JSON.stringify(notes.map((note) => note.slug), null, 2)};\nexport const isKnownNoteSlug = (slug) => NOTE_SLUGS.includes(slug);\n`, 'utf8');
};

const metadata = (template, title, description, pathname) => template
  .replace('<title>hakan.run</title>', `<title>${escapeHtml(title)} | Hakan Dundar</title>`)
  .replace('<link rel="canonical" href="https://hakan.run/" />', `<link rel="canonical" href="https://hakan.run${pathname}" />\n  <meta data-react-helmet="true" name="description" content="${escapeHtml(description)}" />\n  <meta data-react-helmet="true" property="og:title" content="${escapeHtml(title)}" />\n  <meta data-react-helmet="true" property="og:description" content="${escapeHtml(description)}" />\n  <meta data-react-helmet="true" property="og:url" content="https://hakan.run${pathname}" />`);

const staticLink = (note) => `<li><p class="notes-context">${escapeHtml(note.topic)} · ${escapeHtml(note.project)} · <time datetime="${note.date}">${note.date}</time></p><a href="/notes/${note.slug}">${escapeHtml(note.title)}</a><p>${escapeHtml(note.deck)}</p></li>`;
const staticArticle = (note) => `<main class="notes-page"><article class="notes-article"><a href="/notes">← Back to Notes</a><p class="notes-context">${escapeHtml(note.topic)} · ${escapeHtml(note.project)}</p><h1>${escapeHtml(note.title)}</h1><p>${escapeHtml(note.deck)}</p><time datetime="${note.date}">${note.date}</time><div class="notes-body">${note.html}</div><p>— Hakan</p></article></main>`;
const staticIndex = (notes) => `<main class="notes-page"><section class="notes-article"><h1>Engineering Notes</h1><p>Engineering decisions, failures and operational lessons from systems I have built.</p><ul>${notes.map(staticLink).join('')}</ul></section></main>`;
const prerenderStyle = '<style>.notes-page{min-height:100vh;background:#090909;color:#eee;padding:9rem 1.5rem 5rem}.notes-article{max-width:48rem;margin:auto;font:1.125rem/1.8 system-ui,sans-serif}.notes-article h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.15}.notes-article h2{font-size:1.5rem;margin-top:2.5rem}.notes-article p{margin:1.25rem 0}.notes-article a{color:#57b8ff}.notes-article li{margin:2rem 0}.notes-article li .notes-context{margin:0;font:0.75rem/1.5 monospace}.notes-article time,.notes-context{color:#aaa}.notes-article code{font:0.9em monospace;color:#ddd;background:#ffffff12;padding:0.1em 0.3em;border-radius:3px;overflow-wrap:anywhere}.notes-article .notes-body{margin-top:2.5rem}</style>';

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
