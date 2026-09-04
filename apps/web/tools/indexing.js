import fs from 'node:fs';
import path from 'node:path';

// Environment-aware indexing policy for the built site.
//
// Staging is served on a real, publicly resolvable hostname. Without an
// explicit policy it ships the production `robots.txt`, which allows indexing
// and advertises the production sitemap, so a crawler can index a second copy
// of the site and follow it back to production URLs. The guard is applied at
// build time rather than at the edge, because `robots.txt`, `sitemap.xml` and
// `index.html` are static assets: the Worker is not in their request path and
// `run_worker_first` deliberately lists only the protected and API routes.
//
// Production is the default. `vite build` runs in mode "production" unless a
// mode is passed, so forgetting the staging flag produces the existing
// production output rather than silently de-indexing the live site. The
// opposite default would make a forgotten flag an SEO incident.
//
// These helpers are pure so that the difference between the two environments is
// testable without running a build.

export const STAGING_MODE = 'staging';

/** The build mode that must not be indexed. */
export const isStagingBuild = (mode) => mode === STAGING_MODE;

/**
 * Staging `robots.txt`. It disallows everything and names no sitemap: pointing
 * a staging robots file at the production sitemap would advertise production
 * URLs from a host that must not be crawled at all.
 */
export const STAGING_ROBOTS_TXT = `# Staging environment. Not a public surface.
# Nothing on this host may be crawled or indexed.
# The production host is named nowhere in this file on purpose.

User-agent: *
Disallow: /
`;

export const PRODUCTION_ROBOTS_META = '<meta name="robots" content="index, follow" />';
export const STAGING_ROBOTS_META = '<meta name="robots" content="noindex, nofollow" />';

/**
 * Replace the document-level robots directive for a staging build.
 *
 * A missing marker throws rather than returning the document unchanged. Silently
 * skipping would ship an indexable staging build, and the failure would only be
 * visible in a crawler months later; a failed build is visible immediately.
 */
export const applyRobotsMeta = (html, mode) => {
  if (!isStagingBuild(mode)) return html;

  const occurrences = html.split(PRODUCTION_ROBOTS_META).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `Expected exactly one robots meta tag to rewrite for a staging build, found ${occurrences}. ` +
        `The staging indexing guard cannot be applied; fix index.html or tools/indexing.js.`,
    );
  }

  return html.replace(PRODUCTION_ROBOTS_META, STAGING_ROBOTS_META);
};

/** The `robots.txt` body to write over the built one, or null to keep it. */
export const robotsTxtOverride = (mode) =>
  isStagingBuild(mode) ? STAGING_ROBOTS_TXT : null;

/**
 * Staging `sitemap.xml`. It is a valid, empty sitemap rather than a deleted
 * file: with the single-page-application fallback, an absent `/sitemap.xml`
 * answers with `index.html` under HTTP 200, so a crawler or a person checking
 * the endpoint receives an HTML document where a sitemap belongs. An empty
 * `urlset` is well-formed, advertises nothing, and says plainly that this host
 * has no public URLs to offer.
 */
export const STAGING_SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>
`;

/** The `sitemap.xml` body to write over the built one, or null to keep it. */
export const sitemapOverride = (mode) =>
  isStagingBuild(mode) ? STAGING_SITEMAP_XML : null;

/** Absolute paths of the three artifact files the policy governs. */
export const artifactPaths = (outputDirectory) => ({
  robotsTxt: path.join(outputDirectory, 'robots.txt'),
  sitemapXml: path.join(outputDirectory, 'sitemap.xml'),
  indexHtml: path.join(outputDirectory, 'index.html'),
});

/**
 * Write the policy into a built artifact.
 *
 * A production build writes nothing at all: the artifact it already produced is
 * the production artifact, and rewriting files with identical content would
 * only make it harder to prove nothing changed.
 *
 * Returns the list of actions taken, so the caller can print what it did rather
 * than claiming success silently.
 */
export const applyIndexingPolicy = (outputDirectory, mode) => {
  if (!isStagingBuild(mode)) return [];

  const paths = artifactPaths(outputDirectory);
  const actions = [];

  fs.writeFileSync(paths.robotsTxt, STAGING_ROBOTS_TXT, 'utf8');
  actions.push('wrote robots.txt (Disallow: /, no sitemap directive)');

  fs.writeFileSync(paths.sitemapXml, STAGING_SITEMAP_XML, 'utf8');
  actions.push('wrote sitemap.xml (valid, zero entries)');

  const html = fs.readFileSync(paths.indexHtml, 'utf8');
  fs.writeFileSync(paths.indexHtml, applyRobotsMeta(html, STAGING_MODE), 'utf8');
  actions.push('rewrote index.html robots directive to noindex, nofollow');

  return actions;
};

/**
 * Read a built artifact back and report every way it fails its own policy.
 *
 * This exists because the previous design could not fail: the policy lived in a
 * build hook, and if the build never ran the hook, nothing said so. The unit
 * tests still passed, because they tested the policy rather than the artifact.
 * An empty result means the files on disk carry the policy; anything else is a
 * list of specific problems.
 */
export const verifyIndexingPolicy = (outputDirectory, mode) => {
  const paths = artifactPaths(outputDirectory);
  const problems = [];

  for (const [name, file] of Object.entries(paths)) {
    if (!fs.existsSync(file)) problems.push(`${name}: missing at ${file}`);
  }
  if (problems.length > 0) return problems;

  const robots = fs.readFileSync(paths.robotsTxt, 'utf8');
  const sitemap = fs.readFileSync(paths.sitemapXml, 'utf8');
  const html = fs.readFileSync(paths.indexHtml, 'utf8');
  const locations = (sitemap.match(/<loc>/g) ?? []).length;

  if (isStagingBuild(mode)) {
    if (robots !== STAGING_ROBOTS_TXT) problems.push('robots.txt: not the staging policy');
    if (!/^Disallow: \/$/m.test(robots)) problems.push('robots.txt: no "Disallow: /"');
    if (/Sitemap:/i.test(robots)) problems.push('robots.txt: still names a sitemap');
    if (robots.includes('hakan.run')) problems.push('robots.txt: carries a production URL');
    if (sitemap !== STAGING_SITEMAP_XML) problems.push('sitemap.xml: not the staging sitemap');
    if (locations !== 0) problems.push(`sitemap.xml: ${locations} <loc> entries, expected 0`);
    if (sitemap.includes('hakan.run')) problems.push('sitemap.xml: carries production URLs');
    if (!html.includes(STAGING_ROBOTS_META)) problems.push('index.html: no "noindex, nofollow"');
    if (html.includes(PRODUCTION_ROBOTS_META)) problems.push('index.html: still says "index, follow"');
    return problems;
  }

  if (!/^Allow: \/$/m.test(robots)) problems.push('robots.txt: production build must allow crawling');
  if (!/^Sitemap: https:\/\/hakan\.run\/sitemap\.xml$/m.test(robots)) {
    problems.push('robots.txt: production build must name the production sitemap');
  }
  if (locations === 0) problems.push('sitemap.xml: production build must list public URLs');
  if (!html.includes(PRODUCTION_ROBOTS_META)) problems.push('index.html: production build must say "index, follow"');
  return problems;
};
