// DNDR Analytics V2 dual-write: an additive secondary write of a PAGE event
// that hakan.run has already recorded.
//
// hakan.run's own ANALYTICS_DB stays the analytics authority; Boss Analytics
// reads only it. After a native visitor_events row is stored, the same
// observation is sent to the DNDR collector through a Cloudflare Service
// Binding so the two can be compared before anything is cut over.
//
// - Runs only after the source insert succeeded, inside waitUntil: the
//   visitor's response never waits for it, and DNDR never holds a visit
//   hakan.run does not.
// - The DNDR event id is the source row's own id, `visitor_events:<id>`, so a
//   retry is idempotent in DNDR and parity is exact.
// - Never throws; a failure is logged as an outcome with the event id only
//   (no address, no user agent).
// - Enabled only where the binding exists AND ENVIRONMENT is listed in
//   DNDR_FORWARD_ENVIRONMENTS: staging (to dndr-collector-staging) and,
//   since D-046, production (to dndr-collector). Development never forwards.
//   Each environment's binding names its own collector and producer, so
//   staging can never write a production identity or the reverse.
// - Sends no identity of its own choosing: the producer id is the binding's
//   props.producerId (wrangler.jsonc), read by DNDR; the hostname is the one
//   this Worker was invoked on.

export const DNDR_FORWARD_ENVIRONMENTS = Object.freeze(['staging', 'production']);
export const DNDR_FORWARD_ATTEMPTS = 2;
const STATUSES = new Set(['accepted', 'duplicate', 'rejected', 'error']);

export const dndrForwardingEnabled = (env) =>
  Boolean(env?.DNDR_COLLECTOR && typeof env.DNDR_COLLECTOR.recordPage === 'function') &&
  DNDR_FORWARD_ENVIRONMENTS.includes(env.ENVIRONMENT ?? '');

export const producerEventId = (rowId) => `visitor_events:${rowId}`;

// hakan.run stores a referrer as an origin, 'direct' or 'invalid'.
export const forwardedReferrer = (stored) =>
  stored === 'direct' ? '' : stored === 'invalid' || !stored ? null : stored;

export const forwardToDndr = async (env, event) => {
  for (let attempt = 1; attempt <= DNDR_FORWARD_ATTEMPTS; attempt += 1) {
    try {
      const result = await env.DNDR_COLLECTOR.recordPage(event);
      const status = result && STATUSES.has(result.status) ? result.status : 'error';
      if (status !== 'error' || attempt === DNDR_FORWARD_ATTEMPTS) {
        console.log(`dndr-forward: ${status}${result?.reason ? ` (${result.reason})` : ''} ${event.producerEventId}`);
        return status;
      }
    } catch (error) {
      if (attempt === DNDR_FORWARD_ATTEMPTS) {
        console.error(`dndr-forward: error (${error instanceof Error ? error.message : String(error)}) ${event.producerEventId}`);
        return 'error';
      }
    }
  }
  return 'error';
};
