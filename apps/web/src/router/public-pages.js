// The public pages of the site: the paths whose route renders a page rather
// than the 404. PAGE analytics accepts exactly these, in the browser
// (content-source/analytics.js) and at the Worker's write boundary
// (worker/lib/routes.js), so the two cannot disagree. Articles come from the
// generated Notes manifest. `/project/*` is not here: project-detail pages
// were removed and those paths answer 404 (D-047, D-050).
//
// Paths are normalized: no trailing slash, query or hash.

import { isKnownNoteSlug } from '../notes/manifest.js';

export const PUBLIC_PAGE_PATHS = Object.freeze(['/', '/card', '/contact', '/notes']);

const NOTE_PREFIX = '/notes/';

/** True when a normalized path is a public page of the site. */
export const isPublicPagePath = (path) => {
  if (typeof path !== 'string') return false;
  if (PUBLIC_PAGE_PATHS.includes(path)) return true;
  return path.startsWith(NOTE_PREFIX) && isKnownNoteSlug(path.slice(NOTE_PREFIX.length));
};
