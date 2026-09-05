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

import { existsSync } from 'node:fs';
import path from 'node:path';
import { CANONICAL_SECTIONS } from '../worker/lib/content-sections.js';

export const BOOTSTRAP_ACTOR = 'bootstrap';

/** The production origin. Content served from staging must never point at it. */
export const PRODUCTION_ORIGIN = 'https://hakan.run';

/**
 * Fields that exist in production content and must not become APP_DB content.
 *
 * `contact.formEndpoint` is the legacy third-party form endpoint. D-018 replaces
 * it with the Worker's own `/api/contact`, so carrying it across would move a
 * decommissioned integration into the new authority and would let staging post
 * into a live production mailbox. It is removed here rather than ignored at read
 * time, because a value that exists in the authority will eventually be used by
 * something.
 */
export const EXCLUDED_PATHS = ['contact.formEndpoint'];

/**
 * Values that are correct in production and wrong anywhere else.
 *
 * One image in `about` is stored as an absolute production URL while every other
 * asset in the dataset is root-relative. Left alone, staging would hot-link the
 * production host for that one image. Each rule is declared with the value it
 * expects, so a rule that has stopped matching reality fails loudly instead of
 * quietly doing nothing.
 */
export const TRANSFORM_RULES = [
  {
    path: 'about.block1.image',
    from: `${PRODUCTION_ORIGIN}/media/HakanDundar.webp`,
    to: '/media/HakanDundar.webp',
  },
];

// --- CSV input -------------------------------------------------------------

/**
 * Parse a Supabase CSV export: a `section,data` header and one row per section,
 * with RFC 4180 quoting (`""` for a literal quote inside a quoted field).
 *
 * Written rather than delegated because the input is the authoritative record of
 * the site's content and its parsing should be inspectable, and because the
 * whole file is two columns of which one is a JSON blob full of commas, quotes
 * and newlines — precisely the case where a naive split is wrong.
 */
export const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let i = 0;
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

  const endField = () => { row.push(field); field = ''; };
  const endRow = () => { endField(); rows.push(row); row = []; };

  while (i < source.length) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false; i += 1; continue;
      }
      field += char; i += 1; continue;
    }
    if (char === '"') { quoted = true; i += 1; continue; }
    if (char === ',') { endField(); i += 1; continue; }
    if (char === '\n') { endRow(); i += 1; continue; }
    field += char; i += 1;
  }
  if (field.length > 0 || row.length > 0) endRow();

  return rows.filter((entry) => entry.length > 1 || (entry[0] ?? '').trim().length > 0);
};

/** Read a `section,data` CSV export into snapshot rows with parsed payloads. */
export const readSnapshotCsv = (text) => {
  const rows = parseCsv(text);
  if (rows.length === 0) throw new SnapshotError('CSV export is empty');

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const sectionAt = header.indexOf('section');
  const dataAt = header.indexOf('data');
  if (sectionAt === -1 || dataAt === -1) {
    throw new SnapshotError('CSV export must have `section` and `data` columns');
  }

  return readSnapshot(
    rows.slice(1).map((cells) => {
      const section = (cells[sectionAt] ?? '').trim();
      let data;
      try {
        data = JSON.parse(cells[dataAt] ?? '');
      } catch {
        throw new SnapshotError(`section "${section}" does not carry valid JSON`);
      }
      return { section, data };
    }),
  );
};

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

// --- Composition, exclusion, transform --------------------------------------

const clone = (value) => JSON.parse(JSON.stringify(value));

const readPath = (root, dotted) =>
  dotted.split('.').reduce((node, key) => (node == null ? undefined : node[key]), root);

const deletePath = (root, dotted) => {
  const keys = dotted.split('.');
  const last = keys.pop();
  const parent = keys.reduce((node, key) => (node == null ? undefined : node[key]), root);
  if (parent == null || !(last in parent)) return false;
  delete parent[last];
  return true;
};

const setPath = (root, dotted, value) => {
  const keys = dotted.split('.');
  const last = keys.pop();
  const parent = keys.reduce((node, key) => node[key], root);
  parent[last] = value;
};

/** Every string value in the dataset, with its dotted path. */
export const walkValues = function* (node, prefix = '') {
  if (node === null || typeof node !== 'object') {
    yield [prefix, node];
    return;
  }
  if (Array.isArray(node)) {
    for (const [index, value] of node.entries()) yield* walkValues(value, `${prefix}[${index}]`);
    return;
  }
  for (const key of Object.keys(node)) {
    yield* walkValues(node[key], prefix ? `${prefix}.${key}` : key);
  }
};

/**
 * Compose the complete canonical dataset from its two declared sources, then
 * apply the exclusions and transforms.
 *
 * Two sources, named explicitly, because production is not the whole truth:
 * `typography` and `visibility` have never existed as Supabase rows and are
 * currently supplied by the bundled fallback at runtime. Promoting them into
 * APP_DB is the point of the phase — the values do not change, the authority
 * does. Every other canonical section comes from production and only from
 * production; a section present in the fallback but also in the snapshot is
 * never blended, because a partial merge would create a value that exists in
 * neither source.
 *
 * @param {{snapshot: Array, fallback: object}} sources
 */
export const composeDataset = ({ snapshot, fallback }) => {
  const production = new Map(snapshot.map((row) => [row.section, row.data]));
  const provenance = {};
  const sections = {};

  for (const id of CANONICAL_SECTIONS) {
    if (production.has(id)) {
      sections[id] = clone(production.get(id));
      provenance[id] = 'production';
      continue;
    }
    if (fallback && Object.prototype.hasOwnProperty.call(fallback, id)) {
      sections[id] = clone(fallback[id]);
      provenance[id] = 'fallback';
      continue;
    }
    throw new SnapshotError(`no source supplies canonical section "${id}"`);
  }

  const unknown = [...production.keys()].filter((id) => !CANONICAL_SECTIONS.includes(id));
  if (unknown.length > 0) {
    throw new SnapshotError(
      `snapshot carries sections outside the canonical list: ${unknown.join(', ')}. ` +
        'Extend worker/lib/content-sections.js deliberately rather than seeding an unlisted section.',
    );
  }

  const excluded = [];
  for (const dotted of EXCLUDED_PATHS) {
    const value = readPath(sections, dotted);
    if (deletePath(sections, dotted)) excluded.push({ path: dotted, value });
  }

  const transformed = [];
  for (const rule of TRANSFORM_RULES) {
    const value = readPath(sections, rule.path);
    if (value === undefined) continue;
    if (value === rule.to) continue;
    if (value !== rule.from) {
      throw new SnapshotError(
        `transform for "${rule.path}" expected ${JSON.stringify(rule.from)} but found ` +
          `${JSON.stringify(value)}. The rule has stopped matching the data; decide rather than guess.`,
      );
    }
    setPath(sections, rule.path, rule.to);
    transformed.push({ path: rule.path, from: rule.from, to: rule.to });
  }

  return { sections, provenance, excluded, transformed };
};

/** Root-relative asset paths the dataset references, with where each came from. */
export const assetReferences = (sections) => {
  const found = new Map();
  for (const [dotted, value] of walkValues(sections)) {
    if (typeof value !== 'string') continue;
    if (!/^\/[\w./-]+\.(webp|png|jpe?g|svg|gif|avif|ico)$/i.test(value)) continue;
    if (!found.has(value)) found.set(value, []);
    found.get(value).push(dotted);
  }
  return [...found.entries()].map(([asset, paths]) => ({ asset, paths })).sort((a, b) =>
    a.asset < b.asset ? -1 : a.asset > b.asset ? 1 : 0,
  );
};

/**
 * Refuse to seed content that points at files the site does not serve.
 *
 * A broken image reference is not a cosmetic problem here: the whole point of
 * moving the authority into APP_DB is that what it says is what the site is. A
 * dataset that names four images nobody has would make the authority wrong on
 * its first day, and the wrongness would be invisible in the database.
 */
export const verifyAssets = (sections, publicDirectory) => {
  const references = assetReferences(sections);
  const missing = references.filter(
    ({ asset }) => !existsSync(path.join(publicDirectory, asset.replace(/^\//, ''))),
  );
  return { references, missing };
};

/** Every check that must hold before a plan may be produced. */
export const validateDataset = (dataset, publicDirectory) => {
  const problems = [];
  const ids = Object.keys(dataset.sections);

  if (ids.length !== CANONICAL_SECTIONS.length) {
    problems.push(`expected ${CANONICAL_SECTIONS.length} sections, found ${ids.length}`);
  }
  for (const id of CANONICAL_SECTIONS) {
    if (!ids.includes(id)) problems.push(`missing canonical section "${id}"`);
  }
  for (const id of ids) {
    if (!CANONICAL_SECTIONS.includes(id)) problems.push(`unexpected section "${id}"`);
  }

  const serialized = JSON.stringify(dataset.sections);
  if (/formspree/i.test(serialized)) problems.push('the dataset still references formspree');
  if (/supabase/i.test(serialized)) problems.push('the dataset still references supabase');

  // The declared transforms are the only sanctioned handling of production
  // URLs. Anything else pointing at the production origin means the data grew a
  // case the rules do not cover, and that must be decided rather than shipped.
  for (const [dotted, value] of walkValues(dataset.sections)) {
    if (typeof value === 'string' && value.startsWith(PRODUCTION_ORIGIN)) {
      problems.push(`"${dotted}" still points at the production origin: ${value}`);
    }
  }

  if (publicDirectory) {
    const { missing } = verifyAssets(dataset.sections, publicDirectory);
    for (const { asset, paths } of missing) {
      problems.push(`asset ${asset} referenced by ${paths.join(', ')} does not exist locally`);
    }
  }

  return problems;
};

/** The dataset as bootstrap rows, in canonical order. */
export const datasetRows = (dataset) =>
  CANONICAL_SECTIONS.map((section) => ({ section, data: dataset.sections[section] }));

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
