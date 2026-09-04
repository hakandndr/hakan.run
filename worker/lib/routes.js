// Canonical public PAGE routes.
//
// PAGE-only is enforced at write time: the ingestion endpoint rejects anything
// that is not a public page, so visitor_events never contains asset, API or
// system paths. Read queries therefore carry no path allow-list, which keeps
// their index selection simple and predictable.

export const CANONICAL_PAGES = ['/', '/contact'];
export const PROJECT_PREFIX = '/project/';

/** True when a normalized path is a public page worth recording. */
export const isPublicPage = (path) => {
  if (CANONICAL_PAGES.includes(path)) return true;
  if (!path.startsWith(PROJECT_PREFIX)) return false;
  const slug = path.slice(PROJECT_PREFIX.length).replace(/\/$/, '');
  return slug.length > 0 && slug.length <= 128 && /^[a-z0-9-]+$/.test(slug);
};

/** Collapse duplicate slashes and drop query/hash before validation. */
export const normalizePath = (rawPath) => {
  const path = rawPath.split('?')[0].split('#')[0].replace(/\/{2,}/g, '/');
  if (path.length > 1 && path.endsWith('/') && path !== PROJECT_PREFIX) {
    return path.slice(0, -1) || '/';
  }
  return path || '/';
};
