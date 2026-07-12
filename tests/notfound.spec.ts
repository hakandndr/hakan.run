import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('booted', '1'));
});

test('unknown routes render the 404 page', async ({ page }) => {
  await page.goto('/this-page-does-not-exist-xyz');
  await expect(page.getByText('404')).toBeVisible();
  await expect(page.getByRole('link', { name: /back home/i })).toBeVisible();
});

test('404 back-home link returns to the site root', async ({ page }) => {
  await page.goto('/nope-nope');
  await page.getByRole('link', { name: /back home/i }).click();
  await expect(page).toHaveURL(/\/$/);
});
