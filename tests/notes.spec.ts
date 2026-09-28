import { test, expect } from '@playwright/test';
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
