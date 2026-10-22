// The robots directive values of the indexing policy, shared by the build, the
// Worker and the browser.
//
// The build writes the build directive into `index.html` (tools/indexing.js).
// The Worker turns it into the not-found directive on a 404 document
// (document-head.js). In the browser, the robots tag of a document that
// arrived as a 404 no longer carries the build directive, so a route that
// leaves the 404 restores the value derived here from the same build mode
// instead of the value it found in the tag.

export const STAGING_MODE = 'staging';
export const PRODUCTION_ROBOTS_DIRECTIVE = 'index, follow';
export const STAGING_ROBOTS_DIRECTIVE = 'noindex, nofollow';

/** The directive a build of `mode` ships on every page. */
export const buildRobotsDirective = (mode) =>
  (mode === STAGING_MODE ? STAGING_ROBOTS_DIRECTIVE : PRODUCTION_ROBOTS_DIRECTIVE);

/**
 * The directive of a document that is not a page: `noindex`, unless the build
 * already forbids indexing (staging keeps its stricter `noindex, nofollow`).
 */
export const notFoundRobotsDirective = (buildDirective) =>
  (/\bnoindex\b/.test(buildDirective) ? buildDirective : 'noindex');
