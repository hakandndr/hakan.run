// PAGE analytics ingestion.
//
// PAGE-only is enforced here, at the write boundary, so the raw table never
// contains asset, API or system paths and read queries need no allow-list.

import { json, problem } from '../lib/response.js';
import { isPublicPage, normalizePath } from '../lib/routes.js';
import { localDay } from '../lib/time.js';

const AUTOMATED_AGENT = /bot|crawler|spider|headless|curl|wget|facebookexternalhit|meta-external/i;

const bounded = (value, max) => (value ? String(value).slice(0, max) : null);

const classify = (userAgent, cf) => {
  const agent = String(userAgent ?? '');
  const browser = /firefox\//i.test(agent)
    ? 'Firefox'
    : /edg\//i.test(agent)
      ? 'Edge'
      : /chrome\//i.test(agent)
        ? 'Chrome'
        : /safari\//i.test(agent)
          ? 'Safari'
          : 'Other';
  const device = /ipad|tablet/i.test(agent)
    ? 'tablet'
    : /mobile|android|iphone/i.test(agent)
      ? 'mobile'
      : agent
        ? 'desktop'
        : 'unknown';
  const verifiedBot = cf?.botManagement?.verifiedBot === true;
  const strongHuman = typeof cf?.botManagement?.score === 'number' && cf.botManagement.score >= 80;
  const automated = AUTOMATED_AGENT.test(agent);
  return {
    browser,
    device,
    actor: verifiedBot
      ? 'verified-bot'
      : strongHuman
        ? 'human-likely'
        : automated
          ? 'automated-likely'
          : 'unknown',
    source: verifiedBot || strongHuman ? 'cf-bot-management' : automated ? 'user-agent-rule' : 'none',
  };
};

export const handlePageEvent = async (request, env) => {
  if (env.ANALYTICS_ENABLED !== 'true') return json({ status: 'disabled' }, 202);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return problem('invalid_body', 400);
  }

  const path = normalizePath(String(payload.path ?? '/'));
  if (!isPublicPage(path)) return problem('not_a_public_page', 422);

  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return problem('address_unavailable', 400);

  const now = Date.now();
  const userAgent = bounded(request.headers.get('user-agent'), 512) ?? '';
  const profile = classify(userAgent, request.cf);
  let referrer = 'direct';
  try {
    if (payload.referrer) referrer = new URL(String(payload.referrer)).origin.slice(0, 255);
  } catch {
    referrer = 'invalid';
  }

  await env.ANALYTICS_DB.prepare(
    `INSERT INTO visitor_events
      (id, occurred_at, date_local, ip_address, country, region, city, colo, path,
       referrer_origin, user_agent, browser_family, device_class, actor_class,
       classification_source, session_id, request_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      now,
      localDay(now),
      ip,
      bounded(request.cf?.country, 2),
      bounded(request.cf?.region, 100),
      bounded(request.cf?.city, 100),
      bounded(request.cf?.colo, 8),
      path,
      referrer,
      userAgent,
      profile.browser,
      profile.device,
      profile.actor,
      profile.source,
      String(payload.sessionId ?? crypto.randomUUID()).slice(0, 64),
      bounded(request.headers.get('CF-Ray'), 64),
    )
    .run();

  return json({ status: 'recorded' }, 202);
};
