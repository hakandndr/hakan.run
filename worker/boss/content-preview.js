import { json } from '../lib/response.js';
import { CANONICAL_SECTIONS } from '../lib/content-sections.js';
import { validateSection } from '../../apps/web/src/content-source/schema.js';
export const PREVIEW_PATH = '/boss/content/preview';
export const PREVIEW_CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-src 'none'; frame-ancestors 'self'; object-src 'none'";
export const previewHeaders = {
  'cache-control': 'private, no-store', 'referrer-policy': 'no-referrer',
  'x-robots-tag': 'noindex, nofollow, noarchive', 'content-security-policy': PREVIEW_CSP,
  'x-frame-options': 'SAMEORIGIN', 'x-content-type-options': 'nosniff',
};
// One read supplies a coherent saved snapshot. This route performs no writes.
export async function contentPreview(env) {
  if (!env.APP_DB) return json({ error: 'content_unavailable' }, 503, { 'cache-control': 'no-store' });
  const { results = [] } = await env.APP_DB.prepare(`SELECT section, published_data, draft_data, published_revision, updated_at
    FROM content_sections WHERE published_at IS NOT NULL AND published_data IS NOT NULL`).all();
  const sections = [];
  for (const id of CANONICAL_SECTIONS) {
    const row = results.find(r => r.section === id);
    if (!row) return json({ error: 'preview_incomplete', section: id }, 409, { 'cache-control': 'no-store' });
    try {
      const data = JSON.parse(row.draft_data ?? row.published_data);
      if (validateSection(id, data).length) throw new Error('invalid');
      sections.push({ id, data, draft: row.draft_data != null, updatedAt: row.updated_at, revision: row.published_revision ?? 0 });
    } catch { return json({ error: 'preview_invalid', section: id }, 409, { 'cache-control': 'no-store' }); }
  }
  return json({ sections }, 200, { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' });
}
export async function previewShell(request, env) {
  if (!env.ASSETS) return new Response('Unavailable', { status: 503, headers: previewHeaders });
  const asset = await env.ASSETS.fetch(request);
  if (!asset.ok) return new Response('Preview unavailable', { status: 503, headers: previewHeaders });
  // The normal shell contains public tracking scripts. Only its local module
  // entry and stylesheet links belong in this isolated document.
  const html = await asset.text();
  const modules = [...html.matchAll(/<script\b[^>]*type="module"[^>]*src="(\/[^"<>]+)"[^>]*><\/script>/g)].map(m => m[0]);
  const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(m => m[0]);
  if (!modules.length) return new Response('Preview entry unavailable', { status: 503, headers: previewHeaders });
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Private content preview</title>${styles.join('')}</head><body><div id="root"></div>${modules.join('')}</body></html>`, {
    headers: { ...previewHeaders, 'content-type': 'text/html; charset=utf-8' },
  });
}
