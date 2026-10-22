// Canonical public PAGE routes.
//
// PAGE-only is enforced at write time: the ingestion endpoint rejects anything
// that is not a public page, so visitor_events never contains asset, API or
// system paths. Read queries therefore carry no path allow-list, which keeps
// their index selection simple and predictable.

import { isPublicPagePath } from '../../apps/web/src/router/public-pages.js';

/**
 * True when a normalized path is a public page worth recording. The rule is
 * the application's own (apps/web/src/router/public-pages.js), which the
 * browser also applies before sending a PAGE event; a request that skips the
 * browser check is refused here before anything is stored or forwarded.
 */
export const isPublicPage = isPublicPagePath;

/** Collapse duplicate slashes and drop query/hash before validation. */
export const normalizePath = (rawPath) => {
  const path = rawPath.split('?')[0].split('#')[0].replace(/\/{2,}/g, '/');
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1) || '/';
  }
  return path || '/';
};
