// Public content read path.
//
// APP_DB is the runtime content authority. This endpoint reads published rows
// from it and nothing else: there is no Supabase client in the Worker, so
// "staging never reads production Supabase at runtime" is a structural property
// of the code rather than a configuration promise (D-020).
//
// Two behaviours are deliberate and are what the tests pin.
//
// Published-only. A row counts as published when it has both a `published_at`
// and a `published_data`. A draft is not content; a row that was never
// published is absent from the response rather than present and empty.
//
// Fail closed on malformed persisted content. `published_data` is TEXT holding
// JSON. If any published row does not parse, the whole response fails with 500
// rather than the section being skipped, defaulted, or replaced. A silently
// dropped section looks exactly like an unpublished one to the client, and the
// client would then render its fallback for it and call that success. Corrupt
// storage is an operator problem and must surface as one.

import { json } from '../lib/response.js';
import { compareSections } from '../lib/content-sections.js';

/** Published rows only. Ordering is applied in code, from the canonical list. */
export const publishedContentQuery = () => ({
  sql: `SELECT section, published_data, published_revision, published_at
        FROM content_sections
        WHERE published_at IS NOT NULL AND published_data IS NOT NULL`,
  params: [],
});

export class ContentCorruptError extends Error {
  constructor(section) {
    super(`published_data for section "${section}" is not valid JSON`);
    this.name = 'ContentCorruptError';
    this.section = section;
  }
}

/**
 * Build the public payload from raw rows. Pure, so the contract is testable
 * without a database and without a Worker runtime.
 *
 * @throws {ContentCorruptError} when a published row does not parse.
 */
export const buildContentPayload = (rows) => {
  const sections = [...(rows ?? [])]
    .sort((a, b) => compareSections(a.section, b.section))
    .map((row) => {
      let data;
      try {
        data = JSON.parse(row.published_data);
      } catch {
        throw new ContentCorruptError(row.section);
      }
      // A JSON scalar or array is valid JSON but is not a section payload; the
      // frontend overlays sections as objects. Treat it as corrupt rather than
      // letting it reach the client as something it cannot merge.
      if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        throw new ContentCorruptError(row.section);
      }
      return {
        id: row.section,
        revision: row.published_revision ?? null,
        publishedAt: row.published_at ?? null,
        data,
      };
    });

  return {
    contract: 1,
    count: sections.length,
    publishedAt: sections.reduce(
      (latest, section) => (section.publishedAt > latest ? section.publishedAt : latest),
      0,
    ) || null,
    sections,
  };
};

// FNV-1a over the serialized body. The payload is byte-identical for every
// caller, so a weak validator is enough to answer a conditional request without
// re-serializing a decision the client already has.
const entityTag = (body) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < body.length; i += 1) {
    hash ^= body.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `W/"${body.length.toString(36)}-${hash.toString(36)}"`;
};

// Public, identical for everyone, and cheap to revalidate. A short shared TTL
// keeps a publish visible quickly; the validator makes the common case a 304.
const CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

export const handlePublicContent = async (request, env) => {
  if (!env.APP_DB) return json({ error: 'content_unavailable' }, 503);

  const query = publishedContentQuery();
  const result = await env.APP_DB.prepare(query.sql).bind(...query.params).all();

  let payload;
  try {
    payload = buildContentPayload(result.results ?? []);
  } catch (error) {
    if (error instanceof ContentCorruptError) {
      return json({ error: 'content_corrupt', section: error.section }, 500);
    }
    throw error;
  }

  const body = JSON.stringify(payload);
  const etag = entityTag(body);
  const headers = { 'cache-control': CACHE_CONTROL, etag };

  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers });
  }

  return json(payload, 200, headers);
};
