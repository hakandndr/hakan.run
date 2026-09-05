// hakan.run Worker — static assets plus a small, explicit API surface.
//
// Routing is a table, not a catch-all. /boss/* and /api/boss/* are verified
// before any handler runs and fail closed; everything else is either a bounded
// public endpoint or a static asset.
//
// There is no /run/ compatibility route, no third-party form endpoint and no
// /control-room: those legacy surfaces are replaced, not proxied.

import { json, methodNotAllowed, notFound, problem } from './lib/response.js';
import { verifyAccess } from './lib/access.js';
import { handleBossApi } from './boss/index.js';
import { handlePageEvent } from './analytics/ingest.js';
import { handleSubmission } from './public/submissions.js';
import { handlePublicContent } from './public/content.js';
import { aggregationStatements, lastCompleteDay } from './analytics/aggregate.js';

const isBossPath = (path) => path === '/boss' || path.startsWith('/boss/');
const isBossApi = (path) => path.startsWith('/api/boss/');

const denied = (reason) =>
  json({ error: 'forbidden', reason }, 403, { 'cache-control': 'no-store' });

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Private surface: edge Access is necessary but not sufficient. The Worker
    // verifies the assertion itself and then checks the owner allowlist, on
    // every request, including the shell.
    if (isBossPath(path) || isBossApi(path)) {
      const verification = await verifyAccess(request, env);
      if (!verification.ok) return denied(verification.reason);
      if (isBossApi(path)) {
        return handleBossApi(request, env, context, verification.identity);
      }
      // The private shell itself carries no privileged data; every figure it
      // shows arrives through a separately verified API call.
      return env.ASSETS ? env.ASSETS.fetch(request) : notFound();
    }

    if (path === '/api/analytics/page') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return handlePageEvent(request, env);
    }

    // Public content authority. Reads published rows from APP_DB and nothing
    // else; there is no Supabase client in this Worker.
    if (path === '/api/content') {
      if (request.method !== 'GET' && request.method !== 'HEAD') return methodNotAllowed('GET');
      return handlePublicContent(request, env);
    }

    if (path === '/api/contact') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return handleSubmission(request, env, context);
    }

    // An unmatched API path is not found; it never falls through to the SPA
    // shell, which would return 200 HTML to a broken client call.
    if (path.startsWith('/api/')) return notFound();

    if (!env.ASSETS) return problem('assets_unavailable', 503);
    return env.ASSETS.fetch(request);
  },

  // Scheduled aggregation. It aggregates the last complete local day and marks
  // it covered. It has no delete authority: raw detail is removed only by an
  // explicit, audited operator action.
  async scheduled(event, env, context) {
    const day = lastCompleteDay(event.scheduledTime ?? Date.now());
    const statements = aggregationStatements(day, Date.now()).map((statement) =>
      env.ANALYTICS_DB.prepare(statement.sql).bind(...statement.params),
    );
    context.waitUntil(env.ANALYTICS_DB.batch(statements));
  },
};
