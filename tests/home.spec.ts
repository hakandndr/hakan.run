import { test, expect } from '@playwright/test';
import { fulfillPublishedContent, isolatePublicWrites } from './helpers/published-content';

// Skip the one-time terminal boot animation so content is immediately testable.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('hakan.run:boot-intro-seen', '1'));
  await page.route('**/api/content', fulfillPublishedContent);
  await isolatePublicWrites(page);
});

test.describe('Home page', () => {
  test('loads with the correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Hakan Dundar/i);
  });

  test('renders a single top-level heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('exposes the primary navigation in page order (desktop)', async ({ page, isMobile }) => {
    // On mobile the nav collapses behind a menu button, so this is a desktop-layout check.
    test.skip(isMobile, 'Mobile navigation lives behind the menu button.');
    await page.goto('/');
    await expect(page.locator('header nav a')).toHaveText([
      /Services/i,
      /Portfolio/i,
      /Notes/i,
      /About/i,
    ]);
  });
});
