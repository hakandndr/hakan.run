// Server-rendered public documents.
//
// The browser's first paint must describe the same page the application
// hydrates into. The page anatomy (header, footer, theme tokens) comes from
// APP_DB at request time, so the Worker renders the public React tree with the
// same published payload /api/content serves, writes the theme tokens onto
// <html> and <body>, and embeds the payload for hydration. One component tree
// and one content authority produce both states.
//
// If APP_DB or rendering is unavailable, the static asset is returned
// unchanged and the client falls back to its existing fetch-then-render path.

import { buildContentPayload, publishedContentQuery } from './content.js';
import { publishedVisualTokens } from '../../apps/web/src/content-source/visual-tokens.js';

const STATIC_ROOT = '<div id="root"></div>';
const FALLBACK_OUTLET = /<!--ssr-fallback-->[\s\S]*?<!--\/ssr-fallback-->/;
const DOCUMENT_CACHE_CONTROL = 'public, max-age=0, must-revalidate';

const escapeAttribute = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

// JSON inside a <script> element must not be able to close it.
const embedJson = (value) => JSON.stringify(value)
  .replace(/</g, '\\u003c')
  .replace(/[\u2028\u2029]/g, (character) => `\\u${character.charCodeAt(0).toString(16)}`);

const sectionData = (payload, id) => payload.sections.find((section) => section.id === id)?.data;

/** Pure: compose a server-rendered document from a static HTML asset. */
export const composeDocument = (html, { markup, payload }) => {
  const outlet = `<div id="root">${markup}</div>`;
  let composed;
  if (html.includes(STATIC_ROOT)) composed = html.replace(STATIC_ROOT, () => outlet);
  else if (FALLBACK_OUTLET.test(html)) composed = html.replace(FALLBACK_OUTLET, () => markup);
  else throw new Error('document_outlet_missing');

  const { properties, bodyAttributes } = publishedVisualTokens({
    colors: sectionData(payload, 'colors'),
    typography: sectionData(payload, 'typography'),
  });
  const tokenStyle = Object.entries(properties).map(([name, value]) => `${name}:${value}`).join(';');
  composed = composed.replace(/<html\b([^>]*?)\sstyle="([^"]*)"([^>]*)>/, (_, before, style, after) =>
    `<html${before} style="${escapeAttribute(`${style.replace(/;?\s*$/, '')};${tokenStyle}`)}"${after}>`);
  const bodyAttributeText = Object.entries(bodyAttributes)
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`).join('');
  composed = composed.replace(/<body\b([^>]*)>/, (_, attributes) => `<body${attributes}${bodyAttributeText}>`);

  const embedded = `<script id="published-payload" type="application/json">${embedJson(payload)}</script>`;
  if (!composed.includes('</body>')) throw new Error('document_body_missing');
  return composed.replace('</body>', () => `${embedded}\n</body>`);
};

const readPublishedPayload = async (env) => {
  const query = publishedContentQuery();
  const result = await env.APP_DB.prepare(query.sql).bind(...query.params).all();
  return buildContentPayload(result.results ?? []);
};

// The renderer is the Vite server build of apps/web (tools/build.js). Wrangler
// bundles it into the Worker; a checkout without a build cannot render.
const loadRenderer = () => import('../../dist/server/entry-server.mjs');

export const serveDocument = async (request, env) => {
  const asset = await env.ASSETS.fetch(request);
  if (request.method !== 'GET' || !asset.ok || !env.APP_DB) return asset;
  const html = await asset.text();
  const passThrough = () => new Response(html, { status: asset.status, headers: asset.headers });

  try {
    const [payload, renderer] = await Promise.all([readPublishedPayload(env), loadRenderer()]);
    const url = new URL(request.url);
    const markup = renderer.renderPublicApplication({ url: `${url.pathname}${url.search}`, payload });
    const headers = new Headers(asset.headers);
    headers.delete('etag');
    headers.delete('content-length');
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', DOCUMENT_CACHE_CONTROL);
    return new Response(composeDocument(html, { markup, payload }), { status: 200, headers });
  } catch (error) {
    console.error('[document] server render unavailable', error?.message ?? error);
    return passThrough();
  }
};
