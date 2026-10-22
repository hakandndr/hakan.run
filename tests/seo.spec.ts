import { test, expect, type APIRequestContext } from '@playwright/test';
import { fulfillPublishedContent, isolatePublicWrites } from './helpers/published-content';
import { completeSiteContent } from '../apps/web/test-fixtures/published-site.js';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/content', fulfillPublishedContent);
  await isolatePublicWrites(page);
});

test('home page ships social + SEO meta tags', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.png/);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /hakan\.run/);
});

test('the home page carries exactly one robots directive, and it is indexable', async ({ page }) => {
  // A public route must not be collateral damage of the Boss noindex fix: the
  // document owns one robots tag, and on a production artifact its value is the
  // build's. (A staging artifact ships `noindex, nofollow` here instead; that
  // difference is asserted against the built artifact, not the browser.)
  await page.goto('/');
  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveCount(1);
  await expect(robots).toHaveAttribute('content', 'index, follow');
});

// The document the Worker sends, before any script runs: what crawlers and
// link-preview services read. These use the real Worker over the built assets
// (tests/support/document-server.mjs), which serves the shared fixture.
const DOCUMENT_ORIGIN = 'http://localhost:4175';
const content = completeSiteContent();

const rawHead = async (request: APIRequestContext, path: string) => {
  const response = await request.get(`${DOCUMENT_ORIGIN}${path}`, { maxRedirects: 0 });
  const html = await response.text();
  const head = html.slice(0, html.indexOf('</head>'));
  const decode = (value: string) => value.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const all = (pattern: RegExp) => [...head.matchAll(pattern)].map((match) => decode(match[1]));
  return {
    status: response.status(),
    titles: all(/<title\b[^>]*>([^<]*)<\/title>/g),
    canonicals: all(/<link rel="canonical" href="([^"]*)"/g),
    robots: all(/<meta name="robots" content="([^"]*)"/g),
    meta: (key: string) => all(new RegExp(`<meta[^>]*(?:name|property)="${key}"[^>]*content="([^"]*)"`, 'g')),
    socialCount: (head.match(/<meta[^>]*(?:property="og:|name="twitter:)/g) ?? []).length,
  };
};

test('the raw home document carries its complete metadata before any script runs', async ({ request }) => {
  const head = await rawHead(request, '/');
  const title = content.header.siteName;
  const description = content.hero.paragraph;
  expect(head.status).toBe(200);
  expect(head.titles).toEqual([title]);
  expect(head.canonicals).toEqual(['https://hakan.run/']);
  expect(head.robots).toEqual(['index, follow']);
  expect(head.meta('description')).toEqual([description]);
  for (const [key, value] of [
    ['og:type', 'website'], ['og:site_name', title], ['og:title', title], ['og:description', description],
    ['og:url', 'https://hakan.run/'], ['og:image', 'https://hakan.run/og-image.png'],
    ['og:image:width', '1200'], ['og:image:height', '630'], ['twitter:card', 'summary_large_image'],
    ['twitter:title', title], ['twitter:description', description], ['twitter:image', 'https://hakan.run/og-image.png'],
  ]) expect(head.meta(key), key).toEqual([value]);
  expect(head.socialCount).toBe(12);
});

test('the social image the home document names is a served PNG', async ({ request }) => {
  const image = await request.get(`${DOCUMENT_ORIGIN}/og-image.png`);
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toBe('image/png');
  const bytes = await image.body();
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1200, 630]);
});

test('each server-rendered route owns its head; Notes keep theirs; unknown routes inherit none', async ({ request }) => {
  const contact = await rawHead(request, '/contact');
  expect(contact.titles).toEqual([content.contact.pageTitle]);
  expect(contact.canonicals).toEqual(['https://hakan.run/contact']);
  expect(contact.meta('description')).toEqual([content.contact.metaDescription]);
  expect(contact.socialCount).toBe(0);

  const card = await rawHead(request, '/card');
  expect(card.canonicals).toEqual(['https://hakan.run/card']);
  expect(card.titles).toHaveLength(1);
  expect(card.socialCount).toBe(0);

  const article = await rawHead(request, '/notes/reachable-is-not-current');
  expect(article.titles).toEqual(['Reachable is not current | Hakan Dundar']);
  expect(article.canonicals).toEqual(['https://hakan.run/notes/reachable-is-not-current']);
  expect(article.meta('og:title')).toEqual(['Reachable is not current']);
  expect(article.meta('og:url')).toEqual(['https://hakan.run/notes/reachable-is-not-current']);
  expect(article.meta('og:image')).toEqual([]);

  const index = await rawHead(request, '/notes');
  expect(index.titles).toEqual(['Engineering Notes | Hakan Dundar']);
  expect(index.canonicals).toEqual(['https://hakan.run/notes']);

  for (const path of ['/this-route-does-not-exist', '/notes/not-a-real-note']) {
    const unknown = await rawHead(request, path);
    expect(unknown.socialCount, path).toBe(0);
    expect(unknown.titles, path).not.toContain(content.header.siteName);
    expect(unknown.canonicals.length, path).toBeLessThanOrEqual(1);
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the home document still carries its social metadata', async ({ page }) => {
    await page.goto(`${DOCUMENT_ORIGIN}/`);
    await expect(page).toHaveTitle(content.header.siteName);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://hakan.run/og-image.png');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  });
});

test('hydration keeps the server-sent head instead of replacing or duplicating it', async ({ page }) => {
  // Capture the head nodes as they are parsed, before any module script runs.
  await page.addInitScript(() => {
    const w = window as unknown as { __headNodes?: Element[] };
    new MutationObserver((_, observer) => {
      if (!document.querySelector('meta[name="robots"]')) return;
      w.__headNodes = [...document.head.querySelectorAll('title, link[rel="canonical"], meta[name], meta[property]')];
      observer.disconnect();
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto(`${DOCUMENT_ORIGIN}/`, { waitUntil: 'networkidle' });
  await expect(page.locator('#services')).toBeVisible();
  const result = await page.evaluate(() => {
    const before = (window as unknown as { __headNodes: Element[] }).__headNodes;
    const after = [...document.head.querySelectorAll('title, link[rel="canonical"], meta[name], meta[property]')];
    return {
      before: before.length,
      after: after.length,
      replaced: before.filter((node) => !node.isConnected).map((node) => node.outerHTML),
      keys: after.map((node) => node.getAttribute('property') ?? node.getAttribute('name') ?? node.tagName),
    };
  });
  expect(result.replaced).toEqual([]);
  expect(result.after).toBe(result.before);
  expect(new Set(result.keys).size).toBe(result.keys.length);
});
