import { test, expect } from '@playwright/test';
import { fulfillPublishedContent, isolatePublicWrites } from './helpers/published-content';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('booted', '1'));
  await page.route('**/api/content', fulfillPublishedContent);
  await isolatePublicWrites(page);
});

test('contact page shows a working form', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('textarea[name="message"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
});

test('email field enforces type validation', async ({ page }) => {
  await page.goto('/contact');
  const email = page.locator('input[name="email"]');
  await expect(email).toHaveAttribute('type', 'email');
  await expect(email).toHaveAttribute('required', '');
});

// The project detail renderer was deleted; any heading used to satisfy this
// test, including the snapshot error page. It must be the designed 404.
test('a legacy project path renders the designed 404', async ({ page }) => {
  await page.goto('/project/full-stack-development');
  await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});
