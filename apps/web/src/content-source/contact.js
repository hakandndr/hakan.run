// The contact submission path.
//
// Submissions go to the Worker's own `POST /api/contact`, which verifies
// Turnstile, validates, and persists to APP_DB before acknowledging. There is no
// third-party form endpoint any more: `contact.formEndpoint` is excluded from
// the content authority (D-018), so there is nothing left to fall back to and
// nothing that could quietly resume posting to it.
//
// The Worker's contract, which this module exists to speak correctly:
//   202 { id, status: 'stored' }   the submission is durably stored
//   400 invalid_body|invalid_submission
//   403 challenge_failed           Turnstile rejected or absent
//
// 202 rather than 200 is the point of the design — it means "written", not
// "delivered" — so `response.ok` alone is the right success test and any
// narrower check would reject a successful submission.

export const CONTACT_ENDPOINT = '/api/contact';
export const CONFIG_ENDPOINT = '/api/config';

export const CONTACT_RESULT = {
  stored: 'stored',
  invalid: 'invalid',
  challenge: 'challenge',
  failed: 'failed',
};

/** Map a Worker answer onto the outcomes the form can act on. Pure. */
export const interpretContactResponse = ({ ok, status, payload }) => {
  if (ok) {
    const id = payload && typeof payload === 'object' ? payload.id : undefined;
    return { result: CONTACT_RESULT.stored, id: id ?? null };
  }
  if (status === 403) return { result: CONTACT_RESULT.challenge, id: null };
  if (status === 400) return { result: CONTACT_RESULT.invalid, id: null };
  return { result: CONTACT_RESULT.failed, id: null };
};

/**
 * Build the JSON body the Worker validates.
 *
 * The form is still a form — the fields are read from it rather than from React
 * state — but the wire format is JSON because `handleSubmission` parses JSON.
 * Sending the old multipart body would fail as `invalid_body` with a message the
 * visitor could do nothing about.
 */
export const submissionBody = (fields, turnstileToken, sourcePath) => ({
  name: String(fields.name ?? '').trim(),
  email: String(fields.email ?? '').trim(),
  message: String(fields.message ?? '').trim(),
  turnstileToken: turnstileToken ?? null,
  sourcePath: sourcePath || '/contact',
});

/** Load the public runtime configuration. Never throws. */
export const loadPublicConfig = async (fetchImpl = fetch) => {
  try {
    const response = await fetchImpl(CONFIG_ENDPOINT, { headers: { accept: 'application/json' } });
    if (!response.ok) return { turnstileSiteKey: null, reason: `http_${response.status}` };
    const payload = await response.json();
    if (!payload || typeof payload !== 'object') return { turnstileSiteKey: null, reason: 'malformed' };
    const key = payload.turnstileSiteKey;
    return typeof key === 'string' && key.length > 0
      ? { turnstileSiteKey: key, reason: null }
      : { turnstileSiteKey: null, reason: 'not_configured' };
  } catch {
    return { turnstileSiteKey: null, reason: 'transport' };
  }
};

/** Submit to the Worker and report a single, described outcome. */
export const submitContact = async ({ fields, turnstileToken, sourcePath, fetchImpl = fetch }) => {
  let response;
  try {
    response = await fetchImpl(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(submissionBody(fields, turnstileToken, sourcePath)),
    });
  } catch {
    return { result: CONTACT_RESULT.failed, id: null };
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  return interpretContactResponse({ ok: response.ok, status: response.status, payload });
};
