// Staging must not be indexable, and production must be unchanged by that guard.
//
// The two outputs are asserted against each other rather than in isolation: a
// test that only checked staging would still pass if the guard accidentally
// applied to production as well.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  PRODUCTION_ROBOTS_META,
  STAGING_ROBOTS_META,
  STAGING_ROBOTS_TXT,
  STAGING_SITEMAP_XML,
  applyRobotsMeta,
  isStagingBuild,
  robotsTxtOverride,
  sitemapOverride,
} from './indexing.js';

const read = (relative) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

const indexHtml = read('../index.html');
const productionRobotsTxt = read('../public/robots.txt');
const productionSitemapXml = read('../public/sitemap.xml');

test('only the staging mode is treated as staging', () => {
  assert.equal(isStagingBuild('staging'), true);
  assert.equal(isStagingBuild('production'), false);
  assert.equal(isStagingBuild(undefined), false);
  assert.equal(isStagingBuild('Staging'), false);
});

test('the shipped production robots.txt still allows indexing and names the sitemap', () => {
  assert.match(productionRobotsTxt, /^Allow: \/$/m);
  assert.match(productionRobotsTxt, /^Sitemap: https:\/\/hakan\.run\/sitemap\.xml$/m);
  assert.doesNotMatch(productionRobotsTxt, /^Disallow: \/$/m);
});

test('the shipped production sitemap still lists public URLs', () => {
  assert.ok(productionSitemapXml.includes('<loc>https://hakan.run/</loc>'));
  assert.ok((productionSitemapXml.match(/<url>/g) ?? []).length > 0);
});

test('a production build overrides nothing', () => {
  assert.equal(robotsTxtOverride('production'), null);
  assert.equal(sitemapOverride('production'), null);
  assert.equal(applyRobotsMeta(indexHtml, 'production'), indexHtml);
});

test('a staging build disallows every crawler and advertises no sitemap', () => {
  const robots = robotsTxtOverride('staging');
  assert.equal(robots, STAGING_ROBOTS_TXT);
  assert.match(robots, /^Disallow: \/$/m);
  assert.doesNotMatch(robots, /^Allow: \//m);
  assert.doesNotMatch(robots, /Sitemap:/i);
  assert.ok(!robots.includes('hakan.run'), 'staging robots.txt must not name the production host');
});

test('a staging build ships a valid, empty sitemap rather than no sitemap', () => {
  const sitemap = sitemapOverride('staging');
  assert.equal(sitemap, STAGING_SITEMAP_XML);
  // Present, so /sitemap.xml is not answered by the single-page-application
  // fallback with an HTML document under HTTP 200.
  assert.ok(sitemap.length > 0);
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.ok(sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(sitemap.includes('</urlset>'));
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 0);
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, 0);
  assert.ok(!sitemap.includes('hakan.run'), 'staging sitemap must not carry production URLs');
});

test('staging and production policies actually differ', () => {
  assert.notEqual(robotsTxtOverride('staging'), productionRobotsTxt);
  assert.notEqual(sitemapOverride('staging'), productionSitemapXml);
  assert.notEqual(sitemapOverride('staging'), sitemapOverride('production'));
});

test('index.html carries exactly one robots directive for the guard to rewrite', () => {
  assert.equal(indexHtml.split(PRODUCTION_ROBOTS_META).length - 1, 1);
});

test('a staging build emits noindex, nofollow and no index directive', () => {
  const html = applyRobotsMeta(indexHtml, 'staging');
  assert.ok(html.includes(STAGING_ROBOTS_META));
  assert.ok(!html.includes(PRODUCTION_ROBOTS_META));
  assert.match(html, /content="noindex, nofollow"/);
  // Nothing else about the document may change.
  assert.equal(html.replace(STAGING_ROBOTS_META, PRODUCTION_ROBOTS_META), indexHtml);
});

test('a staging build fails loudly when the robots directive is missing', () => {
  assert.throws(
    () => applyRobotsMeta('<html><head></head><body></body></html>', 'staging'),
    /Expected exactly one robots meta tag/,
  );
});

test('a staging build fails loudly when the robots directive is ambiguous', () => {
  assert.throws(
    () => applyRobotsMeta(`${PRODUCTION_ROBOTS_META}${PRODUCTION_ROBOTS_META}`, 'staging'),
    /found 2/,
  );
});
