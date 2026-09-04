// The Boss API client.
//
// One rule shapes this file: a Boss panel must never show something that looks
// like data when it is not. Cloudflare Access sits in front of these routes and
// answers an expired session with a redirect to a login page, and the static
// asset layer answers an unrouted path with the public application shell — both
// arrive as HTML with a successful status. Rendering either as "no results"
// would be a lie, so anything that is not a JSON success is an error the panel
// has to display.

export class BossApiError extends Error {
  constructor(message, { status = 0, code = 'request_failed', path = '' } = {}) {
    super(message);
    this.name = 'BossApiError';
    this.status = status;
    this.code = code;
    this.path = path;
  }
}

const isJson = (contentType) =>
  String(contentType ?? '').toLowerCase().includes('application/json');

/**
 * Decide what a response means, without performing it.
 *
 * Pure, so every branch is testable without a network or a browser.
 *
 * @returns {{kind:'ok'}|{kind:'error', code:string, message:string}}
 */
export const interpretResponse = ({ ok, status, redirected, contentType, payload }) => {
  if (redirected) {
    return {
      kind: 'error',
      code: 'session_expired',
      message:
        'The request was redirected, which means the Access session is no longer valid. Reload the page to sign in again.',
    };
  }

  if (!isJson(contentType)) {
    return {
      kind: 'error',
      code: 'not_json',
      message: `Expected JSON from the Boss API and received ${contentType || 'no content type'}. The request did not reach the Worker.`,
    };
  }

  if (ok) return { kind: 'ok' };

  const code = String(payload?.reason ?? payload?.error ?? 'request_failed');

  if (status === 403) {
    return {
      kind: 'error',
      code,
      message: `Access verification failed at the Worker (${code}). The edge allowed the request and the Worker refused it.`,
    };
  }

  if (status === 404) {
    return { kind: 'error', code, message: 'This Boss endpoint does not exist.' };
  }

  return { kind: 'error', code, message: `The Boss API returned ${status} (${code}).` };
};

/**
 * Fetch a Boss endpoint, or throw a BossApiError describing why not.
 *
 * `fetchImpl` is injectable so the behaviour can be exercised directly.
 */
export const fetchBoss = async (path, { signal, fetchImpl } = {}) => {
  const request = fetchImpl ?? (typeof fetch === 'function' ? fetch : null);
  if (!request) throw new BossApiError('No fetch implementation available.', { path });

  let response;
  try {
    response = await request(path, {
      signal,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new BossApiError(
      `Could not reach the Boss API (${error?.message ?? 'network error'}).`,
      { code: 'network_error', path },
    );
  }

  let payload = null;
  const contentType = response.headers?.get?.('content-type') ?? '';
  if (isJson(contentType)) {
    try {
      payload = await response.json();
    } catch {
      throw new BossApiError('The Boss API returned malformed JSON.', {
        status: response.status,
        code: 'malformed_json',
        path,
      });
    }
  }

  const verdict = interpretResponse({
    ok: response.ok,
    status: response.status,
    redirected: response.redirected,
    contentType,
    payload,
  });

  if (verdict.kind === 'error') {
    throw new BossApiError(verdict.message, {
      status: response.status,
      code: verdict.code,
      path,
    });
  }

  return payload;
};

/** Build a query string from defined values only. */
export const bossQuery = (parameters = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(parameters)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};
