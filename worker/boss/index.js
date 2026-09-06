// Boss V3 API surface.
//
// Canonical modules only: Dashboard, Analytics, Content, Submissions, Audit and
// System. There is no /control-room route in the target and none is created
// here. Every handler runs behind verifyAccess and receives the verified owner
// identity; no handler re-derives authorization from the request.

import { json, notFound, problem } from '../lib/response.js';
import { buildSummary } from '../analytics/summary.js';
import {
  dayOrdinalsQuery,
  deleteEventsQuery,
  deletePreviewQuery,
  eventCountQuery,
  eventStreamQuery,
  oldestEventQuery,
  totalEventsQuery,
  eventsBySourceQuery,
  LEGACY_SOURCE,
  NATIVE_SOURCE,
} from '../analytics/queries.js';
import { localDay, localDayBounds, daysBetween, shiftDay } from '../lib/time.js';

const RETENTION_POLICY_DAYS = 90;
const PAGE_SIZES = [25, 50, 100];

const run = (db) => async ({ sql, params }) => (await db.prepare(sql).bind(...params).all()).results ?? [];

const day = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? '')) ? String(value) : null);

const audit = (env, identity, action, objectType, objectId, detail, requestId) =>
  env.APP_DB.prepare(
    `INSERT INTO audit_events (id, occurred_at, actor, action, object_type, object_id, detail, request_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(crypto.randomUUID(), Date.now(), identity.email, action, objectType, objectId ?? null,
          detail ? JSON.stringify(detail) : null, requestId ?? null)
    .run();

// --- Dashboard --------------------------------------------------------------

const dashboard = async (env) => {
  // `oldestEventQuery` is source-scoped and therefore carries a bound parameter.
  // Preparing its SQL without binding leaves the placeholder unfilled and D1
  // rejects the statement, which is how this became a 500 rather than a wrong
  // number. Go through `run`, the same helper every other call site uses.
  const [submissions, audits, oldestRows] = await Promise.all([
    env.APP_DB.prepare(`SELECT COUNT(*) AS value FROM submissions WHERE status = 'new'`).first(),
    env.APP_DB.prepare(`SELECT COUNT(*) AS value FROM audit_events`).first(),
    run(env.ANALYTICS_DB)(oldestEventQuery(NATIVE_SOURCE)),
  ]);
  const events = oldestRows[0] ?? null;
  return json({
    environment: env.ENVIRONMENT ?? 'unknown',
    pendingSubmissions: Number(submissions?.value ?? 0),
    auditEvents: Number(audits?.value ?? 0),
    oldestAnalyticsEvent: events?.oldest ?? null,
  });
};

// --- Analytics --------------------------------------------------------------

const analyticsSummary = async (url, env) => {
  const today = localDay(Date.now());
  const from = day(url.searchParams.get('from')) ?? shiftDay(today, -29);
  const to = day(url.searchParams.get('to')) ?? today;
  if (from > to) return problem('invalid_range', 400);
  const summary = await buildSummary(run(env.ANALYTICS_DB), { from, to, today });
  return summary ? json(summary) : problem('invalid_range', 400);
};

const parseFilters = (url) => ({
  actor: url.searchParams.get('actor') ?? undefined,
  country: url.searchParams.get('country') ?? undefined,
  browser: url.searchParams.get('browser') ?? undefined,
  path: url.searchParams.get('path') ?? undefined,
  pathExact: url.searchParams.get('pathExact') === 'true',
  ip: url.searchParams.get('ip') ?? undefined,
  ipExact: url.searchParams.get('ipExact') === 'true',
  city: url.searchParams.get('city') ?? undefined,
  referrer: url.searchParams.get('referrer') ?? undefined,
});

const analyticsEvents = async (url, env) => {
  const limit = PAGE_SIZES.includes(Number(url.searchParams.get('limit')))
    ? Number(url.searchParams.get('limit'))
    : 25;
  const page = Math.max(1, Math.min(10_000, Number(url.searchParams.get('page')) || 1));
  const filters = parseFilters(url);
  const from = day(url.searchParams.get('from'));
  const to = day(url.searchParams.get('to'));
  const range = from && to
    ? { start: localDayBounds(from).start, end: localDayBounds(to).end }
    : null;

  const execute = run(env.ANALYTICS_DB);
  const rows = await execute(eventStreamQuery(filters, limit, (page - 1) * limit, range));

  // The total is computed when the filter set changes, which the client signals
  // by omitting knownTotal. Paging reuses the total it already holds, so a page
  // change costs one query rather than two.
  const knownTotal = Number(url.searchParams.get('knownTotal'));
  const total = Number.isSafeInteger(knownTotal) && knownTotal >= 0 && page > 1
    ? knownTotal
    : Number((await execute(eventCountQuery(filters, range)))[0]?.value ?? 0);

  // TODAY ordinals: one bounded query per distinct local day on this page.
  const byDay = new Map();
  for (const row of rows) {
    if (!byDay.has(row.date_local)) byDay.set(row.date_local, []);
    byDay.get(row.date_local).push(row.id);
  }
  const ordinals = new Map();
  for (const [localDate, ids] of byDay) {
    const query = dayOrdinalsQuery(localDate, ids);
    if (!query) continue;
    for (const record of await execute(query)) ordinals.set(record.id, Number(record.ordinal));
  }

  return json({
    events: rows.map((row, index) => ({
      ...row,
      rowNumber: total - (page - 1) * limit - index,
      todayNumber: ordinals.get(row.id) ?? null,
    })),
    pagination: { page, limit, total },
  });
};

const analyticsDeletePreview = async (url, env) => {
  const before = day(url.searchParams.get('before'));
  if (!before) return problem('invalid_cutoff', 400);
  const cutoff = localDayBounds(before).start;
  const rows = await run(env.ANALYTICS_DB)(deletePreviewQuery(cutoff));
  return json({ before, cutoff, affected: Number(rows[0]?.value ?? 0),
                oldest: rows[0]?.oldest ?? null, newest: rows[0]?.newest ?? null });
};

const analyticsDeleteConfirm = async (request, env, identity) => {
  const payload = await request.json().catch(() => null);
  const before = day(payload?.before);
  // Deletion is never implicit: the operator must repeat the cutoff and confirm.
  if (!before || payload?.confirm !== `DELETE ${before}`) {
    return problem('confirmation_required', 400);
  }
  const cutoff = localDayBounds(before).start;
  const preview = await run(env.ANALYTICS_DB)(deletePreviewQuery(cutoff));
  const affected = Number(preview[0]?.value ?? 0);
  const query = deleteEventsQuery(cutoff);
  await env.ANALYTICS_DB.prepare(query.sql).bind(...query.params).run();
  await env.ANALYTICS_DB.prepare(
    `INSERT INTO analytics_deletion_log (id, ran_at, cutoff_at, rows_deleted, actor, request_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(crypto.randomUUID(), Date.now(), cutoff, affected, identity.email,
         request.headers.get('CF-Ray')).run();
  await audit(env, identity, 'analytics.deleted', 'analytics-retention', before,
              { affected, cutoff }, request.headers.get('CF-Ray'));
  return json({ before, deleted: affected });
};

// --- Content ----------------------------------------------------------------

const contentList = async (env) => {
  const rows = await env.APP_DB.prepare(
    `SELECT section, published_revision, published_at, draft_updated_at, updated_at
     FROM content_sections ORDER BY section`,
  ).all();
  return json({ sections: rows.results ?? [] });
};

// --- Submissions ------------------------------------------------------------

const submissionList = async (url, env) => {
  const limit = PAGE_SIZES.includes(Number(url.searchParams.get('limit')))
    ? Number(url.searchParams.get('limit'))
    : 25;
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const rows = await env.APP_DB.prepare(
    `SELECT id, received_at, name, email, message, source_path, country, status,
            notification_state, notification_attempts, notification_error, notified_at
     FROM submissions ORDER BY received_at DESC, id DESC LIMIT ? OFFSET ?`,
  ).bind(limit, (page - 1) * limit).all();
  return json({ submissions: rows.results ?? [], pagination: { page, limit } });
};

// --- Audit ------------------------------------------------------------------

const auditList = async (url, env) => {
  const limit = PAGE_SIZES.includes(Number(url.searchParams.get('limit')))
    ? Number(url.searchParams.get('limit'))
    : 25;
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const rows = await env.APP_DB.prepare(
    `SELECT id, occurred_at, actor, action, object_type, object_id, detail
     FROM audit_events ORDER BY occurred_at DESC, id DESC LIMIT ? OFFSET ?`,
  ).bind(limit, (page - 1) * limit).all();
  return json({ events: rows.results ?? [], pagination: { page, limit } });
};

// --- System -----------------------------------------------------------------

const system = async (env) => {
  const execute = run(env.ANALYTICS_DB);
  // Retention is scoped to native events. Imported legacy history is older than
  // the policy window by definition — it is history — and letting it drive the
  // overdue flag would report a promise as broken that was never made about it.
  const [oldestRow] = await execute(oldestEventQuery(NATIVE_SOURCE));
  const [totalRow] = await execute(totalEventsQuery(NATIVE_SOURCE));
  const bySource = await execute(eventsBySourceQuery());
  const oldest = oldestRow?.oldest ?? null;
  const oldestDay = oldestRow?.oldest_day ?? null;
  const ageDays = oldestDay ? daysBetween(oldestDay, localDay(Date.now())) : 0;

  const legacyRow = bySource.find((row) => row.source === LEGACY_SOURCE) ?? null;
  const legacyOldest = legacyRow?.oldest ?? null;
  const legacyOldestDay = legacyOldest ? localDay(legacyOldest) : null;

  return json({
    environment: env.ENVIRONMENT ?? 'unknown',
    analytics: {
      // Retention is a policy commitment met by an audited operator action, not
      // by a scheduled delete. The overdue flag is how the commitment stays
      // observable rather than assumed.
      policyMaximumDays: RETENTION_POLICY_DAYS,
      automaticPurge: false,
      oldestEventAt: oldest,
      oldestEventDay: oldestDay,
      oldestEventAgeDays: ageDays,
      retentionOverdue: ageDays > RETENTION_POLICY_DAYS,
      retainedEvents: Number(totalRow?.value ?? 0),
    },
    // Imported history, reported on its own terms. It has no overdue state: the
    // 90-day commitment governs what this system collects, and a deliberate
    // archive of older history is not a breach of it. Deleting this is a
    // separate decision from meeting the native retention promise, and the two
    // are kept separate here so neither can be mistaken for the other.
    legacyAnalytics: {
      retainedEvents: Number(legacyRow?.value ?? 0),
      oldestEventAt: legacyOldest,
      oldestEventDay: legacyOldestDay,
      oldestEventAgeDays: legacyOldestDay ? daysBetween(legacyOldestDay, localDay(Date.now())) : 0,
      governedByRetentionPolicy: false,
    },
    eventSources: bySource.map((row) => ({ source: row.source, retainedEvents: Number(row.value) })),
    bindings: {
      appDb: Boolean(env.APP_DB),
      analyticsDb: Boolean(env.ANALYTICS_DB),
      turnstile: Boolean(env.TURNSTILE_SECRET_KEY),
      notifications: env.NOTIFICATIONS_ENABLED === 'true',
      access: Boolean(env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD_BOSS && env.BOSS_OWNER_EMAIL),
    },
  });
};

export const BOSS_MODULES = ['dashboard', 'analytics', 'content', 'submissions', 'audit', 'system'];

export const handleBossApi = async (request, env, context, identity) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === '/api/boss/dashboard' && method === 'GET') return dashboard(env);
  if (path === '/api/boss/analytics/summary' && method === 'GET') return analyticsSummary(url, env);
  if (path === '/api/boss/analytics/events' && method === 'GET') return analyticsEvents(url, env);
  if (path === '/api/boss/analytics/delete-preview' && method === 'GET') return analyticsDeletePreview(url, env);
  if (path === '/api/boss/analytics/delete' && method === 'POST') return analyticsDeleteConfirm(request, env, identity);
  if (path === '/api/boss/content' && method === 'GET') return contentList(env);
  if (path === '/api/boss/submissions' && method === 'GET') return submissionList(url, env);
  if (path === '/api/boss/audit' && method === 'GET') return auditList(url, env);
  if (path === '/api/boss/system' && method === 'GET') return system(env);
  return notFound();
};
