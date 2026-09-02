import { expect, test } from '@playwright/test';

// Explicit refresh scroll restoration. Native browser restoration is disabled
// at boot (`history.scrollRestoration = 'manual'`), so these assertions cover
// the application's own save/restore path rather than browser behaviour.

declare global {
  interface Window {
    __SUPABASE_RUNTIME_CONFIG__?: { url: string; key: string };
  }
}

// Publish a Supabase runtime configuration before boot so the readiness gate
// behaves identically with or without build-time environment variables. Every
// request to it is intercepted below; no real service is contacted.
const configureSupabaseForTest = () => {
  window.__SUPABASE_RUNTIME_CONFIG__ = {
    url: 'https://supabase.e2e.test',
    key: 'e2e-anon-key',
  };
  window.sessionStorage.setItem('booted', '1');
  window.localStorage.removeItem('siteContent');
};

const emptyContent = {
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify([]),
};

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost:3000)/, route => {
    if (route.request().url().includes('/rest/v1/site_content')) {
      return route.fulfill(emptyContent);
    }
    return route.abort();
  });
  await page.addInitScript(configureSupabaseForTest);
});

const scrollTarget = async (page: import('@playwright/test').Page) => {
  const reachable = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  expect(reachable).toBeGreaterThan(400);
  return Math.min(900, Math.floor(reachable / 2));
};

test('a saved scroll position is restored on the next initial load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);

  const target = await scrollTarget(page);
  await page.evaluate(y => window.scrollTo(0, y), target);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(target);

  await page.reload();

  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);
  await expect
    .poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5_000 })
    .toBe(target);
});

test('the position is restored even while authoritative content is still resolving', async ({ page }) => {
  // Authoritative content arrives on a delay, so the restore has to survive the
  // readiness gate — the production case where the page reopened at the top.
  await page.route('**/rest/v1/site_content*', async route => {
    await new Promise(resolve => setTimeout(resolve, 600));
    await route.fulfill(emptyContent);
  });

  await page.goto('/');
  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);

  const target = await scrollTarget(page);
  await page.evaluate(y => window.scrollTo(0, y), target);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(target);

  await page.reload();

  // While gated the content is not painted, so the restore is not visible yet.
  await expect(page.locator('[data-content-ready="false"]')).toHaveCount(1);
  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);
  await expect
    .poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5_000 })
    .toBe(target);
});

test('a position near the bottom of the page is restored on refresh', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  // Read back the position actually reached: late layout growth means the
  // bottom is not exactly the value computed before scrolling.
  const target = await page.evaluate(() => Math.round(window.scrollY));
  expect(target).toBeGreaterThan(1000);

  await page.reload();

  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);
  await expect
    .poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5_000 })
    .toBeGreaterThan(target - 20);
});

test('a load with no saved position opens at the top', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
});

test('an in-app route change still resets the scroll position to the top', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);

  const target = await scrollTarget(page);
  await page.evaluate(y => window.scrollTo(0, y), target);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(target);

  await page.locator('a[href="/contact"]').first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
});

test('an in-app return to a saved pathname does not restore its position', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);

  const target = await scrollTarget(page);
  await page.evaluate(y => window.scrollTo(0, y), target);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));

  await page.locator('a[href="/contact"]').first().click();
  await expect(page).toHaveURL(/\/contact$/);

  await page.locator('a[href="/"]').first().click();
  await expect(page).toHaveURL(/localhost:3000\/$/);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
});

test('native scroll restoration is disabled so it cannot race the explicit restore', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => history.scrollRestoration)).toBe('manual');
});
