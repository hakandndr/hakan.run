import { test, expect } from '@playwright/test';

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
