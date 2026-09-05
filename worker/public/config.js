// Public runtime configuration.
//
// Exactly one thing needs to travel from the Worker to the browser that is not
// content: the Turnstile *site* key. It is public by design — it identifies the
// widget, it is not a credential, and Cloudflare expects it in the page — but it
// is environment-specific, because the staging widget is scoped to the staging
// hostname. So it cannot be hardcoded in source, and it must not be baked in at
// build time either: that would make one artifact unusable in the other
// environment and would reintroduce the build-time configuration this project
// spent a phase removing.
//
// `TURNSTILE_SITE_KEY` has been declared in `wrangler.jsonc` since the staging
// environment was provisioned, and until now nothing read it. This is the reader
// it was declared for.
//
// It is deliberately not part of `/api/content`: a site key is not content, and
// mixing operational configuration into the content contract would mean every
// content consumer has to know about it.

import { json } from '../lib/response.js';

// Short and public. The site key changes only when the widget is replaced, and
// a stale value for a minute is not a correctness problem — a wrong token is
// rejected by the Worker regardless.
const CACHE_CONTROL = 'public, max-age=300';

export const handlePublicConfig = async (request, env) =>
  json(
    {
      contract: 1,
      environment: env.ENVIRONMENT ?? 'unknown',
      // Absent rather than empty when unset, so a client can tell "not
      // configured" from "configured as nothing" and refuse to pretend the
      // challenge is satisfied.
      turnstileSiteKey: env.TURNSTILE_SITE_KEY || null,
    },
    200,
    { 'cache-control': CACHE_CONTROL },
  );
