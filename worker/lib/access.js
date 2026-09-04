// Cloudflare Access verification.
//
// Two independent checks, both of which must pass:
//
//   1. the assertion Access forwards is cryptographically valid for this
//      application (signature, issuer, audience, expiry); and
//   2. the identity it carries is the configured owner.
//
// Being authenticated is not being authorized. Client-side routing is never
// part of this decision, and every privileged request repeats both checks.
//
// Everything fails closed: a missing binding, an absent header, an unreachable
// key set or an unparsable token all deny. There is no development bypass.

const ASSERTION_HEADER = 'cf-access-jwt-assertion';
const keyCache = new Map();

const base64UrlToBytes = (value) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const decodeSegment = (segment) =>
  JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));

const fetchKeys = async (teamDomain) => {
  const cached = keyCache.get(teamDomain);
  if (cached && cached.expires > Date.now()) return cached.keys;
  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error('access_certs_unavailable');
  const body = await response.json();
  const keys = body.keys ?? [];
  keyCache.set(teamDomain, { keys, expires: Date.now() + 3_600_000 });
  return keys;
};

const verifySignature = async (token, keys) => {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return false;
  const { kid } = decodeSegment(header);
  const jwk = keys.find((key) => key.kid === kid);
  if (!jwk) return false;
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    base64UrlToBytes(signature),
    new TextEncoder().encode(`${header}.${payload}`),
  );
};

/**
 * @returns {Promise<{ok: true, identity: {subject: string, email: string}} | {ok: false, reason: string}>}
 */
export const verifyAccess = async (request, env) => {
  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  const audience = env.ACCESS_AUD_BOSS;
  const owner = env.BOSS_OWNER_EMAIL;
  if (!teamDomain || !audience || !owner) return { ok: false, reason: 'access_not_configured' };

  const token = request.headers.get(ASSERTION_HEADER);
  if (!token) return { ok: false, reason: 'assertion_missing' };

  try {
    const keys = await fetchKeys(teamDomain);
    if (!(await verifySignature(token, keys))) return { ok: false, reason: 'signature_invalid' };

    const claims = decodeSegment(token.split('.')[1]);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiences.includes(audience)) return { ok: false, reason: 'audience_mismatch' };
    if (claims.iss !== `https://${teamDomain}`) return { ok: false, reason: 'issuer_mismatch' };
    if (typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now()) {
      return { ok: false, reason: 'expired' };
    }

    const email = String(claims.email ?? '').toLowerCase();
    if (email !== owner.toLowerCase()) return { ok: false, reason: 'not_owner' };

    return { ok: true, identity: { subject: String(claims.sub ?? ''), email } };
  } catch {
    return { ok: false, reason: 'verification_failed' };
  }
};
