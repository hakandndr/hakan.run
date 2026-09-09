// Private content management. All routes are reached only after verified Access.
// The environment gate prevents accidental production writes during development.
import { json, notFound } from '../lib/response.js';
import { isCanonicalSection } from '../lib/content-sections.js';
import { validateSection } from '../../apps/web/src/content-source/schema.js';

const MAX_BYTES = 131072;
const headers = { 'cache-control': 'no-store' };
const reply = (body, status = 200) => json(body, status, headers);
const fail = (code, status = 400) => reply({ error: code }, status);
const version = (row) => Number(row?.updated_at ?? 0);
const revision = (row) => Number(row?.published_revision ?? 0);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
const parse = (value) => value == null ? null : JSON.parse(value);

export class ContentValidationError extends Error {
  constructor(code) { super(code); this.name = 'ContentValidationError'; }
}
const invalid = (code) => { throw new ContentValidationError(code); };

export const validateContent = (section, data) => {
  const errors = validateSection(section, data);
  if (errors.length) { const error = new ContentValidationError('content_invalid'); error.fields = errors; throw error; }
  return canonical(data);
};

const read = async (db, section) =>
  db.prepare(`SELECT section, draft_data, published_data, draft_updated_at,
    published_at, published_revision, updated_at FROM content_sections WHERE section = ?`)
    .bind(section).first();

const detail = (row) => ({
  section: row.section,
  draft: parse(row.draft_data),
  published: parse(row.published_data),
  draftUpdatedAt: row.draft_updated_at,
  publishedAt: row.published_at,
  publishedRevision: row.published_revision,
  updatedAt: row.updated_at,
});

const body = async (request) => {
  if (!String(request.headers.get('content-type')).toLowerCase().startsWith('application/json')) invalid('json_required');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BYTES * 2) invalid('request_too_large');
  try {
    const value = JSON.parse(text);
    if (!object(value)) invalid('invalid_payload');
    return value;
  } catch (error) {
    if (error instanceof ContentValidationError) throw error;
    invalid('invalid_json');
  }
};
const expected = (payload, row) => {
  if (!Number.isSafeInteger(payload.expectedVersion) || payload.expectedVersion < 0 ||
      !Number.isSafeInteger(payload.expectedRevision) || payload.expectedRevision < 0) {
    invalid('expected_version_required');
  }
  if (payload.expectedVersion !== version(row) || payload.expectedRevision !== revision(row)) {
    return false;
  }
  return true;
};
// A no-op UPDATE is a transactional compare-and-swap gate. D1 batch() runs
// every statement in one transaction; later statements repeat the predicate.
const guard = (db, section, payload, extra = '1 = 1') =>
  db.prepare(`UPDATE content_sections SET updated_at = updated_at WHERE section = ?
    AND updated_at = ? AND COALESCE(published_revision, 0) = ? AND (${extra})`)
    .bind(section, payload.expectedVersion, payload.expectedRevision);
const audit = (db, identity, action, section, detail, request, newTime, newRevision) =>
  db.prepare(`INSERT INTO audit_events
    (id, occurred_at, actor, action, object_type, object_id, detail, request_id)
    SELECT ?, ?, ?, ?, 'content_section', ?, ?, ?
    WHERE EXISTS (SELECT 1 FROM content_sections WHERE section = ?
      AND updated_at = ? AND COALESCE(published_revision, 0) = ? AND changes() = 1)`)
    .bind(crypto.randomUUID(), Date.now(), identity.email, action, section,
      JSON.stringify(detail), request.headers.get('CF-Ray'), section, newTime, newRevision);
const transactional = async (db, statements) => {
  const results = await db.batch(statements);
  return Number(results[0]?.meta?.changes ?? 0) === 1;
};

const write = async (request, env, identity, section, action, targetRevision = null) => {
  const db = env.APP_DB;
  const payload = await body(request);
  const row = await read(db, section);
  if (!row) return fail('section_not_found', 404);
  if (!expected(payload, row)) return fail('content_conflict', 409);
  const now = Date.now();
  const nextTime = Math.max(now, version(row) + 1);
  const statements = [];
  let data = null;
  let nextRevision = revision(row);
  let note = null;

  if (action === 'draft') {
    data = validateContent(section, payload.data, parse(row.published_data));
    if (row.draft_data !== null && canonical(parse(row.draft_data)) === data) return reply(detail(row));
    statements.push(guard(db, section, payload));
    statements.push(db.prepare(`UPDATE content_sections SET draft_data = ?, draft_updated_at = ?,
      updated_at = ? WHERE section = ? AND updated_at = ? AND COALESCE(published_revision, 0) = ?`).bind(data, nextTime, nextTime, section, payload.expectedVersion, payload.expectedRevision));
  } else if (action === 'discard') {
    if (row.draft_data === null) return reply(detail(row));
    statements.push(guard(db, section, payload));
    statements.push(db.prepare(`UPDATE content_sections SET draft_data = NULL, draft_updated_at = NULL,
      updated_at = ? WHERE section = ? AND updated_at = ? AND COALESCE(published_revision, 0) = ?`).bind(nextTime, section, payload.expectedVersion, payload.expectedRevision));
  } else if (action === 'publish') {
    if (row.draft_data === null) return fail('draft_required', 400);
    data = validateContent(section, parse(row.draft_data), parse(row.published_data));
    statements.push(guard(db, section, payload, 'draft_data IS NOT NULL'));
    if (row.published_data !== null && canonical(parse(row.published_data)) === data) {
      // Publishing an unchanged draft clears it without creating fake history.
      statements.push(db.prepare(`UPDATE content_sections SET draft_data = NULL, draft_updated_at = NULL,
        updated_at = ? WHERE section = ? AND updated_at = ? AND COALESCE(published_revision, 0) = ?`).bind(nextTime, section, payload.expectedVersion, payload.expectedRevision));
      action = 'discard';
    } else {
      nextRevision += 1;
      note = typeof payload.note === 'string' ? payload.note.slice(0, 500) : '';
    }
  } else if (action === 'restore') {
    if (row.draft_data !== null) return fail('discard_or_publish_draft_first', 409);
    const old = await db.prepare(`SELECT data FROM content_revisions WHERE section = ? AND revision = ?`)
      .bind(section, targetRevision).first();
    if (!old) return fail('revision_not_found', 404);
    data = validateContent(section, parse(old.data), parse(row.published_data));
    if (row.published_data !== null && canonical(parse(row.published_data)) === data) return reply(detail(row));
    statements.push(guard(db, section, payload, 'draft_data IS NULL'));
    nextRevision += 1;
    note = `Restore revision ${targetRevision}`;
  }
  if ((action === 'publish' || action === 'restore') && nextRevision > revision(row)) {
    statements.push(db.prepare(`INSERT INTO content_revisions
      (section, revision, data, created_at, actor, note)
      SELECT ?, ?, ?, ?, ?, ? FROM content_sections
      WHERE section = ? AND updated_at = ? AND COALESCE(published_revision, 0) = ?`)
      .bind(section, nextRevision, data, nextTime, identity.email, note,
        section, payload.expectedVersion, payload.expectedRevision));
    statements.push(db.prepare(`UPDATE content_sections SET published_data = ?, published_revision = ?,
      published_at = ?, draft_data = NULL, draft_updated_at = NULL, updated_at = ?
      WHERE section = ? AND updated_at = ? AND COALESCE(published_revision, 0) = ?`)
      .bind(data, nextRevision, nextTime, nextTime, section, payload.expectedVersion, payload.expectedRevision));
  }
  statements.push(audit(db, identity, `content.${action}`, section,
    { previousRevision: revision(row), revision: nextRevision,
      restoredFrom: action === 'restore' ? targetRevision : null }, request, nextTime, nextRevision));
  if (!await transactional(db, statements)) return fail('content_conflict', 409);
  return reply(detail(await read(db, section)));
};

export const handleContentManagement = async (request, env, identity, path) => {
  const match = /^\/api\/boss\/content\/([a-z][a-z0-9-]*)(?:\/(draft|publish|revisions)(?:\/([1-9]\d*))?)?$/.exec(path);
  if (!match) return notFound();
  const [, section, operation, number] = match;
  if (!isCanonicalSection(section)) return notFound();
  const method = request.method;
  const db = env.APP_DB;
  if (method === 'GET') {
    if (!operation) {
      const row = await read(db, section);
      return row ? reply(detail(row)) : fail('section_not_found', 404);
    }
    if (operation === 'revisions') {
      if (number) {
        const row = await db.prepare(`SELECT section, revision, data, created_at, actor, note
          FROM content_revisions WHERE section = ? AND revision = ?`).bind(section, Number(number)).first();
        return row ? reply({ ...row, data: parse(row.data) }) : fail('revision_not_found', 404);
      }
      const rows = await db.prepare(`SELECT section, revision, created_at, actor, note
        FROM content_revisions WHERE section = ? ORDER BY revision DESC LIMIT 100`).bind(section).all();
      return reply({ revisions: rows.results ?? [] });
    }
    return notFound();
  }
  // Production requires an explicit string opt-in; unknown environments deny.
  const writesEnabled = env.ENVIRONMENT === 'staging'
    || (env.ENVIRONMENT === 'production' && env.CMS_PRODUCTION_WRITES_ENABLED === 'true');
  if (!writesEnabled) return fail('production_writes_not_enabled', 403);
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return fail('origin_required', 403);
  try {
    if (operation === 'draft' && !number && method === 'PUT')
      return await write(request, env, identity, section, 'draft');
    if (operation === 'draft' && !number && method === 'DELETE')
      return await write(request, env, identity, section, 'discard');
    if (operation === 'publish' && !number && method === 'POST')
      return await write(request, env, identity, section, 'publish');
    if (operation === 'revisions' && number && method === 'POST')
      return await write(request, env, identity, section, 'restore', Number(number));
  } catch (error) {
    if (error instanceof ContentValidationError) return reply({ error: error.message, fields: error.fields ?? [] }, 400);
    throw error;
  }
  return notFound();
};
