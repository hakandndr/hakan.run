// The public response security policy. This module is the only authority:
// the Worker applies it to the responses it produces, and the web build renders
// it into the Static Assets `_headers` file for asset-first responses.
//
// HSTS starts at one day, without includeSubDomains or preload, so the HTTPS
// rollout stays reversible; see docs/SECURITY.md before raising it.

export const HSTS = 'max-age=86400';

/** Headers every HTTPS response carries, documents and API alike. */
export const COMMON_HEADERS = Object.freeze({
  'Strict-Transport-Security': HSTS,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
});

// Content Security Policy for public documents, derived from the audited
// dependencies: first-party modules and styles, Turnstile's script and frame,
// the same-origin Boss preview frame, first-party APIs, the data: favicon and
// absolute https images the CMS schema permits. Cloudflare Web Analytics is
// enabled for the zone with automatic setup: the edge injects its beacon from
// static.cloudflareinsights.com, which reports to the same-origin /cdn-cgi/rum.
// Inline styles are required by server-rendered style attributes, the
// documents' <style> blocks and runtime-injected toast styles. No inline or
// eval script is allowed.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'self' https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// Anti-framing is enforced from the first release, because frame-ancestors is
// ignored in a report-only policy.
export const FRAMING_POLICY = "frame-ancestors 'none'; base-uri 'self'; object-src 'none'";

// 'report-only' observes the full policy while enforcing framing protection;
// 'enforce' makes the full policy the single enforced Content-Security-Policy.
export const CSP_MODE = 'report-only';

export const documentHeaders = (mode = CSP_MODE) => Object.freeze(mode === 'enforce'
  ? { 'X-Frame-Options': 'DENY', 'Content-Security-Policy': CONTENT_SECURITY_POLICY }
  : {
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': FRAMING_POLICY,
    'Content-Security-Policy-Report-Only': CONTENT_SECURITY_POLICY,
  });

const CSP_HEADERS = ['content-security-policy', 'content-security-policy-report-only'];

/**
 * Apply the policy to a Worker response. Common headers are always set on
 * HTTPS. Document headers are added only to HTML, and only where the response
 * has no policy of its own: a route-specific CSP or X-Frame-Options, such as
 * the Boss content preview's same-origin framing, is never replaced.
 */
export const withSecurityHeaders = (request, response, mode = CSP_MODE) => {
  const secured = new Response(response.body, response);
  const https = new URL(request.url).protocol === 'https:';
  for (const [name, value] of Object.entries(COMMON_HEADERS)) {
    if (name === 'Strict-Transport-Security' && !https) {
      // A server-rendered document copies asset headers; HSTS belongs to HTTPS only.
      secured.headers.delete(name);
      continue;
    }
    secured.headers.set(name, value);
  }
  if (!/^text\/html\b/i.test(secured.headers.get('content-type') ?? '')) return secured;
  const document = documentHeaders(mode);
  const ownPolicy = CSP_HEADERS.some((name) => secured.headers.has(name));
  if (!secured.headers.has('x-frame-options')) secured.headers.set('X-Frame-Options', document['X-Frame-Options']);
  if (!ownPolicy) {
    for (const name of ['Content-Security-Policy', 'Content-Security-Policy-Report-Only']) {
      if (document[name]) secured.headers.set(name, document[name]);
    }
  }
  return secured;
};

/**
 * Static Assets `_headers` rules for asset-first responses. The same values as
 * the Worker applies to HTML documents; on non-document assets the document
 * headers are inert.
 */
export const renderHeadersFile = (mode = CSP_MODE) => {
  const headers = { ...COMMON_HEADERS, ...documentHeaders(mode) };
  const lines = Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`);
  return `# Generated from worker/lib/security-headers.js by apps/web/tools/build.js.\n# Do not edit; change the policy module instead.\n/*\n${lines.join('\n')}\n`;
};
