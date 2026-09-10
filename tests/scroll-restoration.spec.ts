import { expect, test } from '@playwright/test';

const emptyContent = {
  status: 200,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify({ contract: 1, count: 0, publishedAt: null, sections: [] }),
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('booted', '1'));
  await page.route(/\/assets\/Application-[^/]+\.js$/, async route => {
    await new Promise(resolve => setTimeout(resolve, 400));
    await route.continue();
  });
  await page.route('**/api/content', route => route.fulfill(emptyContent));
});

const scrollTarget = async (page: import('@playwright/test').Page) => {
  await page.waitForFunction(
    () => document.documentElement.scrollHeight - window.innerHeight > 400,
  );
  const reachable = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  expect(reachable).toBeGreaterThan(400);
  return Math.min(900, Math.floor(reachable / 2));
};

test('a hard refresh restores the previous homepage scroll position', async ({ page }) => {
  await page.goto('/');

  expect(await page.evaluate(() => history.scrollRestoration)).toBe('manual');
  const target = await scrollTarget(page);
  await page.evaluate(y => window.scrollTo(0, y), target);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(target);

  await page.reload({ waitUntil: 'load' });

  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    ),
  ).toBeLessThanOrEqual(0);
  await expect
    .poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5_000 })
    .toBe(target);
});

test('an in-app route change still starts at the top', async ({ page }) => {
  await page.goto('/');

  const target = await scrollTarget(page);
  await page.evaluate(y => window.scrollTo(0, y), target);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(target);

  await page.locator('a[href="/contact"]').first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
});
