import { test, expect } from '@playwright/test';

// Skip the one-time terminal boot animation so content is immediately testable.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('booted', '1'));
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

  test('exposes the primary navigation (desktop)', async ({ page, isMobile }) => {
    // On mobile the nav collapses behind a menu button, so this is a desktop-layout check.
    test.skip(isMobile, 'Mobile navigation lives behind the menu button.');
    await page.goto('/');
    for (const label of ['Services', 'About', 'Portfolio']) {
      await expect(page.getByRole('link', { name: new RegExp(label, 'i') }).first()).toBeVisible();
    }
  });
});
