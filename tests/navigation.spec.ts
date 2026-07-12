import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('booted', '1'));
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

test('a project detail page renders', async ({ page }) => {
  await page.goto('/project/full-stack-development');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
});
