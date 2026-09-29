import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fulfillPublishedContent, isolatePublicWrites } from './helpers/published-content';
import { NOTES } from '../apps/web/src/notes/catalog.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('booted', '1'));
  await page.route('**/api/content', fulfillPublishedContent);
  await isolatePublicWrites(page);
});

test('Notes index and all articles direct-open with metadata and usable layout', async ({ page }) => {
  const indexResponse = await page.goto('/notes');
  expect(indexResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://hakan.run/notes');
  for (const { slug, title } of NOTES) {
    const response = await page.goto(`/notes/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page).toHaveTitle(`${title} | Hakan Dundar`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://hakan.run/notes/${slug}`);
    await expect(page.locator('time')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('homepage, navigation, reload and history reach Notes', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.locator('#notes')).toBeVisible();
  await expect(page.locator('#notes a[href="/notes"]')).toBeVisible();
  if (isMobile) await page.getByRole('button', { name: 'Open navigation menu' }).click();
  const nav = page.getByRole('navigation', { name: isMobile ? 'Mobile navigation' : 'Primary navigation' });
  await expect(nav.locator('a')).toHaveText([/Services$/, /Portfolio$/, /Notes$/, /About$/]);
  await nav.getByRole('link', { name: /Notes/ }).click();
  await expect(page).toHaveURL(/\/notes$/);
  await page.getByRole('link', { name: /Reachable is not current/ }).click();
  await expect(page).toHaveURL(/\/notes\/reachable-is-not-current$/);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Reachable is not current' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'Reachable is not current' })).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.tagName)).toMatch(/A|BUTTON/);
});

test('existing entry pages link to Notes without altering their primary content', async ({ page, isMobile }) => {
  await page.goto('/contact');
  await expect(page.locator('input[name="email"]')).toBeVisible();
  if (isMobile) await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.getByRole('navigation', { name: isMobile ? 'Mobile navigation' : 'Primary navigation' }).getByRole('link', { name: /Notes/ })).toHaveAttribute('href', '/notes');
  await page.goto('/card');
  await expect(page.getByRole('link', { name: 'Notes' })).toHaveAttribute('href', '/notes');
});

test('Notes direct-open stays readable when the CMS snapshot is unavailable', async ({ page }) => {
  await page.unroute('**/api/content');
  await page.route('**/api/content', (route) => route.fulfill({ status: 503, body: 'unavailable' }));
  const failedLoad = page.waitForEvent('console', { predicate: (message) => message.type() === 'error' && message.text().includes('[Notes bootstrap]') });
  const response = await page.goto('/notes/a-write-path-for-a-mostly-static-site');
  expect(response?.status()).toBe(200);
  await failedLoad;
  await expect(page.getByRole('heading', { level: 1, name: 'A write path for a mostly static site' })).toBeVisible();
  await expect(page.getByText('The first model was consistent and still wrong')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'A write path for a mostly static site' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://hakan.run/notes/a-write-path-for-a-mostly-static-site');
});

test('Cloudflare-style static Notes HTML hydrates without duplicate metadata', async ({ page }) => {
  const html = readFileSync(resolve('dist/apps/web/notes/reachable-is-not-current.html'), 'utf8');
  await page.route('**/notes/reachable-is-not-current', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: html,
  }));
  await page.goto('/notes/reachable-is-not-current');
  await expect(page.getByRole('banner')).toBeVisible();
  for (const selector of [
    'meta[name="description"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:url"]',
  ]) {
    await expect(page.locator(selector)).toHaveCount(1);
  }
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://hakan.run/notes/reachable-is-not-current');
});

test('homepage shows exactly the three selected Notes and /notes lists all of them', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#notes li h3')).toHaveText([
    'Moving a live static site to the edge without moving everything',
    'A write path for a mostly static site',
    'Why the status page ignores single failed probes',
  ]);
  await page.goto('/notes');
  await expect(page.locator('[data-public-section="notes-index"] li h2')).toHaveCount(NOTES.length);
  await expect(page.locator('[data-public-section="notes-index"] li h2')).toHaveText(NOTES.map((note) => note.title));
});


// Records every same-document view transition and what is actually visible at
// the moment the new route state is committed: the element at the centre of
// the viewport, the lowest opacity on its ancestor chain and the amount of page
// text. Zero opacity or no text would mean the new snapshot is an empty frame.
const recordRouteTransitions = async (page: Page) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __routeTransitions: Array<Record<string, unknown>> };
    w.__routeTransitions = [];
    const original = document.startViewTransition?.bind(document);
    if (!original) return;
    document.startViewTransition = ((update: () => void) => original(() => {
      update();
      const probe = document.elementFromPoint(window.innerWidth / 2, window.innerHeight * 0.45);
      let minOpacity = 1;
      for (let node = probe; node; node = node.parentElement) minOpacity = Math.min(minOpacity, Number(getComputedStyle(node).opacity));
      w.__routeTransitions.push({
        path: location.pathname,
        scrollY: Math.round(window.scrollY),
        minOpacity,
        text: (document.querySelector('main')?.textContent ?? '').trim().length,
      });
    })) as typeof document.startViewTransition;
  });
};
const transitions = (page: Page) => page.evaluate(() => (window as unknown as { __routeTransitions: Array<Record<string, number | string>> }).__routeTransitions);

test('Notes navigation blends through a view transition with persistent chrome and no empty frame', async ({ page }) => {
  await recordRouteTransitions(page);
  await page.goto('/');
  await expect(page.locator('#notes')).toBeVisible();
  const header = page.locator('header').first();
  await header.evaluate((element) => { element.dataset.probe = 'persistent'; });
  const boot = page.locator('[data-boot-intro]');
  const bootCount = await boot.count();
  if (bootCount) await boot.evaluate((element) => { element.dataset.probe = 'first-entry'; });

  await page.locator('#notes').scrollIntoViewIfNeeded();
  await page.locator('#notes a[href="/notes"]').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  await page.waitForTimeout(300);
  const indexScroll = await page.evaluate(() => Math.round(window.scrollY));
  expect(indexScroll).toBeGreaterThan(300);

  await page.getByRole('link', { name: /Reachable is not current/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Reachable is not current' })).toBeVisible();
  await page.getByRole('link', { name: '← Back to Notes' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Reachable is not current' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(indexScroll);
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'Reachable is not current' })).toBeVisible();
  await page.locator('header a[aria-label="Home"]').first().click();
  await expect(page.locator('#notes')).toBeAttached();

  const recorded = await transitions(page);
  expect(recorded.map((entry) => entry.path)).toEqual([
    '/notes', '/notes/reachable-is-not-current', '/notes', '/notes/reachable-is-not-current', '/notes', '/notes/reachable-is-not-current', '/',
  ]);
  for (const entry of recorded) {
    expect(entry.minOpacity, `visible content committed for ${entry.path}`).toBeGreaterThan(0.9);
    expect(entry.text, `page content committed for ${entry.path}`).toBeGreaterThan(200);
  }
  // Scroll is settled inside the committed state, so the jump is never painted.
  expect(recorded[0].scrollY).toBe(0);
  expect(recorded[4].scrollY).toBe(indexScroll);

  await expect(header).toHaveAttribute('data-probe', 'persistent');
  await expect(boot).toHaveCount(bootCount);
  if (bootCount) await expect(boot).toHaveAttribute('data-probe', 'first-entry');
});

test('hash navigation, direct-open, reload and reduced motion do not start a route transition', async ({ page, isMobile }) => {
  await recordRouteTransitions(page);
  await page.goto('/notes/reachable-is-not-current');
  await expect(page.getByRole('heading', { level: 1, name: 'Reachable is not current' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Reachable is not current' })).toBeVisible();
  expect(await transitions(page)).toEqual([]);

  await page.goto('/');
  await expect(page.locator('#portfolio')).toBeAttached();
  if (!isMobile) {
    await page.locator('header nav a[href="/#portfolio"]').click();
    await expect(page).toHaveURL(/\/#portfolio$/);
    await page.locator('header nav a[href="/#about"]').click();
    await expect(page).toHaveURL(/\/#about$/);
  }
  expect(await transitions(page)).toEqual([]);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#notes a[href="/notes"]').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();
  await page.getByRole('link', { name: /Two languages/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Two languages, not one translation' })).toBeVisible();
  expect(await transitions(page)).toEqual([]);
});
