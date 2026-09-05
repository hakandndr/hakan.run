// One-time staging content bootstrap: production snapshot -> staging APP_DB.
//
// This module plans the bootstrap. It does not perform it, and it cannot: it
// opens no network connection, holds no credential, and reads no provider. It
// takes a snapshot file the owner exports, and emits the SQL that would seed the
// staging APP_DB. Executing that SQL is a separate, authorized step.
//
// Direction is one-way and enforced by construction. The production Supabase
// `site_content` table is the read side and is never named in a generated
// statement; the staging APP_DB is the only write target. Nothing here can
// write to production because nothing here can reach it.
//
// Idempotency without a schema change. `content_sections` has no content hash
// column, so re-running the same snapshot is made safe by comparison instead:
// a section whose stored `published_data` already equals the snapshot's is
// skipped entirely — no row update, no new revision, no `updated_at` churn. A
// revision is written only when the published bytes actually change, which is
// what makes `content_revisions` a history of changes rather than a log of how
// many times the bootstrap was run.
//
// Legacy shape mapping. Supabase `site_content` has no draft/publish concept:
// every row is live. So a snapshot row maps to a *published* section — the
// snapshot is, by definition, what production is serving. `draft_data` is left
// null, because inventing a draft from a published value would assert an edit
// that never happened.

import { CANONICAL_SECTIONS } from '../worker/lib/content-sections.js';

export const BOOTSTRAP_ACTOR = 'bootstrap';

/** Stable JSON: object keys sorted, so byte comparison means value comparison. */
export const canonicalJson = (value) => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
};

export class SnapshotError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SnapshotError';
  }
}

/**
 * Validate a production snapshot and normalise it to `[{ section, data }]`.
 *
 * Accepts the natural export shapes: an array of `{ section, data }` rows, or a
 * plain object keyed by section. Anything else is refused rather than coerced —
 * guessing at the shape of the authoritative content is exactly the step where
 * a silent mistake becomes the site's new truth.
 */
export const readSnapshot = (raw) => {
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object'
      ? Object.entries(raw).map(([section, data]) => ({ section, data }))
      : null;

  if (!rows) throw new SnapshotError('snapshot must be an array of rows or an object keyed by section');
  if (rows.length === 0) throw new SnapshotError('snapshot is empty; refusing to bootstrap nothing');

  const seen = new Set();
  return rows.map((row) => {
    if (!row || typeof row !== 'object') throw new SnapshotError('every snapshot row must be an object');
    const { section, data } = row;
    if (typeof section !== 'string' || section.length === 0) {
      throw new SnapshotError('every snapshot row needs a non-empty section id');
    }
    if (seen.has(section)) throw new SnapshotError(`section "${section}" appears twice in the snapshot`);
    seen.add(section);
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      throw new SnapshotError(`section "${section}" must carry an object payload`);
    }
    return { section, data };
  });
};

/**
 * Report how a snapshot relates to the canonical section list. Neither
 * direction is fatal — the list is a source-controlled fact, the snapshot is a
 * production fact, and a difference is something the owner should see and
 * decide about rather than something a script should silently resolve.
 */
export const compareToCanonical = (snapshot) => {
  const present = new Set(snapshot.map((row) => row.section));
  return {
    missing: CANONICAL_SECTIONS.filter((id) => !present.has(id)),
    unknown: snapshot.map((row) => row.section).filter((id) => !CANONICAL_SECTIONS.includes(id)),
  };
};

/**
 * Plan the bootstrap against the current state of the staging APP_DB.
 *
 * @param snapshot  normalised rows from `readSnapshot`
 * @param existing  current rows: `[{ section, published_data, published_revision }]`
 * @param at        publish timestamp for rows this run changes
 */
export const planBootstrap = (snapshot, existing = [], at = Date.now()) => {
  const current = new Map(
    existing.map((row) => [row.section, row]),
  );

  const actions = snapshot.map(({ section, data }) => {
    const serialized = canonicalJson(data);
    const row = current.get(section);

    if (!row) return { section, action: 'insert', revision: 1, data: serialized };

    const stored = row.published_data ?? null;
    if (stored !== null && canonicalJson(JSON.parse(stored)) === serialized) {
      // Byte-identical after canonicalisation: the snapshot has already been
      // applied. Doing nothing is the correct action, not a degenerate one.
      return { section, action: 'unchanged', revision: row.published_revision ?? null, data: serialized };
    }

    return {
      section,
      action: 'update',
      revision: Number(row.published_revision ?? 0) + 1,
      data: serialized,
    };
  });

  return {
    at,
    actions,
    summary: {
      insert: actions.filter((a) => a.action === 'insert').length,
      update: actions.filter((a) => a.action === 'update').length,
      unchanged: actions.filter((a) => a.action === 'unchanged').length,
    },
  };
};

const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;

/**
 * Render a plan as statements for the staging APP_DB.
 *
 * `unchanged` sections produce no statement at all. That is the idempotency
 * property in its most direct form: running the same snapshot twice produces a
 * second run with nothing to do.
 */
export const bootstrapStatements = (plan, note = 'Bootstrap from production snapshot') => {
  const statements = [];

  for (const action of plan.actions) {
    if (action.action === 'unchanged') continue;

    statements.push({
      sql: `INSERT INTO content_revisions (section, revision, data, created_at, actor, note)
            VALUES (?, ?, ?, ?, ?, ?)`,
      params: [action.section, action.revision, action.data, plan.at, BOOTSTRAP_ACTOR, note],
    });

    statements.push({
      sql: `INSERT INTO content_sections
              (section, draft_data, published_data, draft_updated_at, published_at, published_revision, updated_at)
            VALUES (?, NULL, ?, NULL, ?, ?, ?)
            ON CONFLICT (section) DO UPDATE SET
              published_data     = excluded.published_data,
              published_at       = excluded.published_at,
              published_revision = excluded.published_revision,
              updated_at         = excluded.updated_at`,
      params: [action.section, action.data, plan.at, action.revision, plan.at],
    });

    statements.push({
      sql: `INSERT INTO audit_events (id, occurred_at, actor, action, object_type, object_id, detail, request_id)
            VALUES (?, ?, ?, 'content.bootstrap', 'content_section', ?, ?, NULL)`,
      params: [
        `bootstrap-${action.section}-${action.revision}`,
        plan.at,
        BOOTSTRAP_ACTOR,
        action.section,
        JSON.stringify({ revision: action.revision, from: 'production_snapshot' }),
      ],
    });
  }

  return statements;
};

/** The same statements as a runnable SQL script, for review before execution. */
export const bootstrapSql = (plan, note) =>
  bootstrapStatements(plan, note)
    .map(({ sql, params }) => {
      let index = -1;
      return `${sql.replace(/\?/g, () => {
        index += 1;
        return params[index] === null ? 'NULL' : quote(params[index]);
      })};`;
    })
    .join('\n\n');
