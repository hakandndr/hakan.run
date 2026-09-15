// Server-side Turnstile verification. The widget result reported by the client
// is never sufficient; a missing secret denies rather than degrades.

export const verifyTurnstile = async (token, env, remoteIp) => {
  if (!env.TURNSTILE_SECRET_KEY) return { ok: false, reason: 'turnstile_not_configured' };
  if (!env.TURNSTILE_EXPECTED_HOSTNAME) {
    return { ok: false, reason: 'turnstile_hostname_not_configured' };
  }
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) {
    return { ok: false, reason: 'token_invalid' };
  }
  try {
    const body = new FormData();
    body.append('secret', env.TURNSTILE_SECRET_KEY);
    body.append('response', token);
    if (remoteIp) body.append('remoteip', remoteIp);
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body },
    );
    if (!response.ok) return { ok: false, reason: 'verification_unavailable' };
    const result = await response.json();
    return result.success === true
      && result.action === 'contact'
      && result.hostname === env.TURNSTILE_EXPECTED_HOSTNAME
      ? { ok: true }
      : { ok: false, reason: 'challenge_failed' };
  } catch {
    return { ok: false, reason: 'verification_failed' };
  }
};
