// The public content source: what the runtime is allowed to believe.
//
// This lives in `content-source/` rather than `content/` on purpose: `@/content`
// already resolves to the fallback module `src/content.js`, and a sibling
// directory of the same name would make every import of either one depend on
// resolver tie-breaking rules. The two are different things and are named
// differently.
//
// APP_DB is the content authority and `/api/content` is the only runtime path
// to it. The job of this module is to keep three different things from looking
// like each other:
//
//   ready   — the API answered and published content came back;
//   empty   — the API answered correctly and nothing is published yet;
//   failed  — the request, the response, or the contract was wrong.
//
// `empty` is a valid answer about the world. `failed` is an absence of an
// answer. Collapsing the second into the first is the bug this module exists to
// prevent: a site whose content API is down would otherwise render its built-in
// fallback and report success, and no one would learn that the authority was
// unreachable. The fallback is still shown in both cases — see ContentContext
// for why — but only one of them is content.

export const CONTENT_ENDPOINT = '/api/content';

/** The contract version this client understands. A different one is not ours. */
export const CONTENT_CONTRACT = 1;

export const CONTENT_STATE = {
  loading: 'loading',
  ready: 'ready',
  empty: 'empty',
  failed: 'failed',
};

const failed = (reason) => ({ state: CONTENT_STATE.failed, reason, sections: [] });

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Decide what a response means. Pure, so every branch is testable without a
 * network, a DOM or a build.
 *
 * @param {{ok:boolean,status:number,redirected?:boolean,contentType?:string,payload?:unknown}} response
 */
export const interpretContentResponse = ({ ok, status, redirected, contentType, payload }) => {
  // A redirect on a public read means something answered that is not the API —
  // an edge login page, a proxy. It is never content.
  if (redirected) return failed('redirected');

  if (!ok) return failed(`http_${status}`);

  // The failure this project has already had once: the asset layer answering an
  // API path with the single-page-application shell, HTTP 200, text/html.
  if (contentType && !/application\/json/i.test(contentType)) return failed('not_json');

  if (!isPlainObject(payload)) return failed('malformed');
  if (payload.contract !== CONTENT_CONTRACT) return failed('unsupported_contract');
  if (!Array.isArray(payload.sections)) return failed('malformed');

  // A count that disagrees with the array is an integrity failure, not a
  // rounding detail: one of the two was produced from something we did not see.
  if (typeof payload.count === 'number' && payload.count !== payload.sections.length) {
    return failed('malformed');
  }

  for (const section of payload.sections) {
    if (!isPlainObject(section)) return failed('malformed');
    if (typeof section.id !== 'string' || section.id.length === 0) return failed('malformed');
    // `data` is what gets overlaid onto the content object. Anything that is not
    // a plain object cannot be overlaid and must not be attempted partially.
    if (!isPlainObject(section.data)) return failed('malformed');
  }

  if (payload.sections.length === 0) {
    return { state: CONTENT_STATE.empty, reason: null, sections: [] };
  }

  return { state: CONTENT_STATE.ready, reason: null, sections: payload.sections };
};

/**
 * Overlay published sections onto a base content object.
 *
 * Shallow by section, which is the legacy semantic and is preserved
 * deliberately: a published section replaces that section entirely rather than
 * being deep-merged into it. Deep-merging would make it impossible to publish a
 * section that removes a field, and would leave stale nested values alive with
 * no way to see them.
 */
export const mergeSections = (base, sections) => {
  if (!sections || sections.length === 0) return base;
  const next = { ...base };
  for (const section of sections) next[section.id] = section.data;
  return next;
};

/** Fetch and interpret in one step. Any thrown error is a transport failure. */
export const loadContent = async (fetchImpl = fetch) => {
  let response;
  try {
    response = await fetchImpl(CONTENT_ENDPOINT, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
    });
  } catch {
    return failed('transport');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    // A body that will not parse is not an empty result.
    return interpretContentResponse({
      ok: response.ok,
      status: response.status,
      redirected: response.redirected,
      contentType: response.headers?.get?.('content-type') ?? '',
      payload: undefined,
    });
  }

  return interpretContentResponse({
    ok: response.ok,
    status: response.status,
    redirected: response.redirected,
    contentType: response.headers?.get?.('content-type') ?? '',
    payload,
  });
};
