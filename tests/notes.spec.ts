import { test, expect } from '@playwright/test';
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
    'The engineering rules I stopped relearning',
    'A write path for a mostly static site',
    'Moving a live static site to the edge without moving everything',
  ]);
  await page.goto('/notes');
  await expect(page.locator('[data-public-section="notes-index"] li h2')).toHaveCount(NOTES.length);
  await expect(page.locator('[data-public-section="notes-index"] li h2')).toHaveText(NOTES.map((note) => note.title));
});

test('in-app navigation into Notes uses the short fade without replaying the boot intro', async ({ page }) => {
  const enter = page.locator('[data-route-enter="notes"]');
  const animation = () => enter.evaluate((element) => {
    const style = getComputedStyle(element);
    return `${style.animationName} ${style.animationDuration}`;
  });

  await page.goto('/notes/reachable-is-not-current');
  await expect(page.getByRole('heading', { level: 1, name: 'Reachable is not current' })).toBeVisible();
  await expect(enter).toHaveCount(0);

  await page.goto('/');
  await expect(page.locator('#notes')).toBeVisible();
  const boot = page.locator('[data-boot-intro]');
  const bootCount = await boot.count();
  if (bootCount) await boot.evaluate((element) => { element.dataset.firstEntry = 'kept'; });
  await page.locator('#notes').scrollIntoViewIfNeeded();

  await page.locator('#notes a[href="/notes"]').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();
  await expect(enter).toHaveCount(1);
  expect(await animation()).toBe('route-enter 0.18s');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(boot).toHaveCount(bootCount);
  if (bootCount) await expect(boot).toHaveAttribute('data-first-entry', 'kept');

  await page.getByRole('link', { name: /A write path for a mostly static site/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'A write path for a mostly static site' })).toBeVisible();
  await expect(enter).toHaveCount(1);
  await page.getByRole('link', { name: '← Back to Notes' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();
  await expect(enter).toHaveCount(1);

  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'A write path for a mostly static site' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();
  await page.goBack();
  await expect(page.locator('#notes')).toBeVisible();
  await expect(enter).toHaveCount(0);
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('link', { name: /Reachable is not current/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Reachable is not current' })).toBeVisible();
  expect((await animation()).split(' ')[0]).toBe('none');
});
