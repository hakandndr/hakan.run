import { expect, test } from '@playwright/test';

const emptyContent = {
  status: 200,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify({ contract: 1, count: 0, publishedAt: null, sections: [] }),
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('booted', '1');

    const browserScrollTo = window.scrollTo.bind(window);
    const scrollCalls: unknown[][] = [];
    Object.defineProperty(window, '__browserScrollTo', { value: browserScrollTo });
    Object.defineProperty(window, '__scrollCalls', { value: scrollCalls });
    window.scrollTo = (...args: Parameters<typeof window.scrollTo>) => {
      scrollCalls.push(args);
      browserScrollTo(...args);
    };
  });
  await page.route('**/api/content', route => route.fulfill(emptyContent));
});

const scrollTarget = async (page: import('@playwright/test').Page) => {
  const reachable = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  expect(reachable).toBeGreaterThan(400);
  return Math.min(900, Math.floor(reachable / 2));
};

test('a hard refresh restores the previous homepage scroll position', async ({ page }) => {
  await page.goto('/');

  const target = await scrollTarget(page);
  await page.evaluate(y => {
    const instrumentedWindow = window as typeof window & {
      __browserScrollTo: typeof window.scrollTo;
      __scrollCalls: unknown[][];
    };
    instrumentedWindow.__browserScrollTo(0, y);
    instrumentedWindow.__scrollCalls.length = 0;
  }, target);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(target);

  await page.reload();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const calls = (window as typeof window & { __scrollCalls: unknown[][] })
          .__scrollCalls;
        return calls.filter(
          args =>
            (args.length >= 2 && args[0] === 0 && args[1] === 0) ||
            (typeof args[0] === 'object' &&
              args[0] !== null &&
              'top' in args[0] &&
              args[0].top === 0),
        ).length;
      }),
    )
    .toBe(0);
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
