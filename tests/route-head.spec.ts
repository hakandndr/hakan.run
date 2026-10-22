import { test, expect, type Page } from '@playwright/test';
import { completeSiteContent } from '../apps/web/test-fixtures/published-site.js';

// The document head after client-side route transitions. The Worker sends each
// route's head in its raw HTML (seo.spec.ts); these tests check that leaving or
// entering the 404 route inside one document ends in the same head a direct
// request for the destination would have produced: one canonical link exactly
// when the route is a page, the build's robots value on pages, and only the
// destination's own title and social tags.
const DOCUMENT_ORIGIN = 'http://localhost:4175';
const content = completeSiteContent();
const NOT_FOUND_TITLE = '404 — Page Not Found | Hakan Dundar';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('booted', '1'));
  await page.route('**/api/analytics/**', (route) => route.abort());
});

const headState = (page: Page) => page.evaluate(() => ({
  title: document.title,
  canonicals: [...document.head.querySelectorAll('link[rel="canonical"]')].map((node) => node.getAttribute('href')),
  robots: [...document.head.querySelectorAll('meta[name="robots"]')].map((node) => node.getAttribute('content')),
  social: [...document.head.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')]
    .map((node) => `${node.getAttribute('property') ?? node.getAttribute('name')}=${node.getAttribute('content')}`)
    .sort(),
}));

// The head of a document requested directly, once hydration has settled.
const directHead = async (page: Page, path: string, ready: string) => {
  await page.goto(`${DOCUMENT_ORIGIN}${path}`);
  await expect(page.locator(ready)).toBeVisible();
  return headState(page);
};

// Navigate inside the current document without a link, the way the router
// sees a history entry it did not create (an address the site never links to).
const navigateInApp = (page: Page, path: string) => page.evaluate((target) => {
  window.history.pushState({}, '', target);
  window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
}, path);

const markDocument = (page: Page) => page.evaluate(() => { (window as unknown as { __sameDocument: boolean }).__sameDocument = true; });
const expectSameDocument = async (page: Page) =>
  expect(await page.evaluate(() => (window as unknown as { __sameDocument?: boolean }).__sameDocument)).toBe(true);

test('the reference heads: a page names itself and the 404 names no canonical', async ({ page }) => {
  const home = await directHead(page, '/', '#services');
  expect(home.title).toBe(content.header.siteName);
  expect(home.canonicals).toEqual(['https://hakan.run/']);
  expect(home.robots).toEqual(['index, follow']);
  expect(home.social).toHaveLength(12);

  const missing = await directHead(page, '/no-such-page', 'text=404');
  expect(missing.title).toBe(NOT_FOUND_TITLE);
  expect(missing.canonicals).toEqual([]);
  expect(missing.robots).toEqual(['noindex']);
  expect(missing.social).toEqual([]);
});

test('leaving a server-rendered 404 for the homepage restores the homepage head', async ({ page }) => {
  const home = await directHead(page, '/', '#services');
  await directHead(page, '/no-such-page', 'text=404');
  await markDocument(page);

  await page.getByRole('link', { name: /back home/i }).click();
  await expect(page).toHaveURL(`${DOCUMENT_ORIGIN}/`);
  await expect(page.locator('#services')).toBeVisible();
  await expect.poll(() => headState(page)).toEqual(home);
  await expectSameDocument(page);
});

test('entering the 404 from a page drops the canonical and indexing, and Back and Forward follow', async ({ page }) => {
  const missing = await directHead(page, '/no-such-page', 'text=404');
  const home = await directHead(page, '/', '#services');
  await markDocument(page);

  await navigateInApp(page, '/no-such-page');
  await expect(page.getByRole('link', { name: /back home/i })).toBeVisible();
  await expect.poll(() => headState(page)).toEqual(missing);

  await page.goBack();
  await expect(page.locator('#services')).toBeVisible();
  await expect.poll(() => headState(page)).toEqual(home);

  await page.goForward();
  await expect(page.getByRole('link', { name: /back home/i })).toBeVisible();
  await expect.poll(() => headState(page)).toEqual(missing);
  await expectSameDocument(page);
});

test('from a server-rendered 404, Back and Forward between it and other pages keep each head', async ({ page }) => {
  const notes = await directHead(page, '/notes', '[data-public-section="notes-index"]');
  const home = await directHead(page, '/', '#services');
  const missing = await directHead(page, '/no-such-page', 'text=404');
  await markDocument(page);

  await page.getByRole('link', { name: /back home/i }).click();
  await expect(page.locator('#services')).toBeVisible();
  await expect.poll(() => headState(page)).toEqual(home);

  await page.getByRole('link', { name: 'View all notes →' }).click();
  await expect(page.locator('[data-public-section="notes-index"]')).toBeVisible();
  await expect.poll(() => headState(page)).toEqual(notes);

  await page.goBack();
  await expect(page.locator('#services')).toBeVisible();
  await expect.poll(() => headState(page)).toEqual(home);

  await page.goBack();
  await expect(page.getByRole('link', { name: /back home/i })).toBeVisible();
  await expect.poll(() => headState(page)).toEqual(missing);

  await page.goForward();
  await expect(page.locator('#services')).toBeVisible();
  await expect.poll(() => headState(page)).toEqual(home);
  await expectSameDocument(page);
});

test('an unknown note inside the document is the same 404 head, and leaving it restores the page', async ({ page }) => {
  // A direct request for an unknown note gets the Worker's minimal static 404
  // page, which never hydrates; inside the document the route renders the
  // application's 404, whose head is the reference.
  const missing = await directHead(page, '/no-such-page', 'text=404');
  const notes = await directHead(page, '/notes', '[data-public-section="notes-index"]');
  await markDocument(page);

  await navigateInApp(page, '/notes/not-a-real-note');
  await expect(page.getByRole('link', { name: /back home/i })).toBeVisible();
  await expect.poll(() => headState(page)).toEqual(missing);

  await page.goBack();
  await expect(page.locator('[data-public-section="notes-index"]')).toBeVisible();
  await expect.poll(() => headState(page)).toEqual(notes);
  await expectSameDocument(page);
});
