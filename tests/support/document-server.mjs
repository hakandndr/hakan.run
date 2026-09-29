// Local production-shaped server for first-paint tests.
//
// `vite preview` serves static files only, so it can never show what the
// Worker sends. This runs the real Worker module against the built assets:
// ASSETS follows Cloudflare's Static Assets rules used by this project
// (file, file.html, SPA fallback to index.html) and APP_DB answers the
// published-content query from the same fixture the other browser tests use.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../../worker/index.js';
import { completeSiteContent } from '../../apps/web/test-fixtures/published-site.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist/apps/web');
const port = Number(process.argv[2] ?? 4175);
const PUBLISHED_AT = 1_789_081_238_918;

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml',
};

const assetFile = (pathname) => {
  const direct = path.join(root, decodeURIComponent(pathname));
  if (!direct.startsWith(root)) return null;
  for (const candidate of [direct, `${direct}.html`, path.join(direct, 'index.html')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return path.join(root, 'index.html');
};

// Static Assets apply the generated _headers file to asset responses. The
// build emits a single "/*" rule, which is all this emulation supports.
const assetHeaders = () => {
  const file = path.join(root, '_headers');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n')
    .filter((line) => /^\s+\S/.test(line))
    .map((line) => { const index = line.indexOf(':'); return [line.slice(0, index).trim(), line.slice(index + 1).trim()]; });
};

const ASSETS = {
  async fetch(request) {
    const file = assetFile(new URL(request.url).pathname);
    if (!file) return new Response('Not found', { status: 404 });
    const headers = new Headers({ 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'public, max-age=0, must-revalidate' });
    for (const [name, value] of assetHeaders()) headers.set(name, value);
    return new Response(fs.readFileSync(file), { status: 200, headers });
  },
};

const rows = Object.entries(completeSiteContent()).map(([section, data]) => ({
  section, published_data: JSON.stringify(data), published_revision: 1, published_at: PUBLISHED_AT,
}));
const APP_DB = {
  prepare: (sql) => ({
    bind: () => ({
      all: async () => ({ results: /FROM content_sections/.test(sql) ? rows : [] }),
      first: async () => null,
      run: async () => ({ success: true }),
    }),
  }),
};

const env = { ASSETS, APP_DB, ENVIRONMENT: 'local', ANALYTICS_ENABLED: 'false' };

http.createServer(async (incoming, outgoing) => {
  try {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const request = new Request(`http://localhost:${port}${incoming.url}`, {
      method: incoming.method,
      headers: incoming.headers,
      body: ['GET', 'HEAD'].includes(incoming.method) ? undefined : Buffer.concat(chunks),
    });
    const response = await worker.fetch(request, env, { waitUntil() {} });
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(incoming.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    outgoing.writeHead(500, { 'content-type': 'text/plain' });
    outgoing.end(String(error?.stack ?? error));
  }
}).listen(port, () => console.log(`document server on http://localhost:${port}`));
