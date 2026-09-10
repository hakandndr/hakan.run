import { expect, test, type Page } from '@playwright/test';

const emptyContent = {
  status: 200,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify({ contract: 1, count: 0, publishedAt: null, sections: [] }),
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('booted', '1'));
  await page.route('**/api/content', route => route.fulfill(emptyContent));
});

const waitForScrollableDocument = async (page: Page) => {
  await page.waitForFunction(
    () => document.documentElement.scrollHeight - window.innerHeight > 400,
    null,
    { polling: 10 },
  );
};

const scrollTarget = async (page: Page) => {
  await waitForScrollableDocument(page);
  const reachable = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  return Math.min(900, Math.floor(reachable / 2));
};

const scrollToTarget = async (page: Page) => {
  const target = await scrollTarget(page);
  await page.evaluate(y => window.scrollTo(0, y), target);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(target);
  return target;
};

const expectScrollNear = async (page: Page, target: number) => {
  await expect
    .poll(() => page.evaluate(y => Math.abs(Math.round(window.scrollY) - y), target))
    .toBeLessThanOrEqual(8);
};

const hardReload = async (page: Page) => {
  const session = await page.context().newCDPSession(page);
  const loaded = page.waitForEvent('load');
  await session.send('Page.reload', { ignoreCache: true });
  await loaded;
  await session.detach();
};

test('the public document is scrollable at load without an async Application chunk', async ({
  page,
}) => {
  let applicationChunkRequested = false;
  await page.route(/\/assets\/Application-[^/]+\.js$/, async route => {
    applicationChunkRequested = true;
    await new Promise(resolve => setTimeout(resolve, 400));
    await route.continue();
  });

  await page.goto('/', { waitUntil: 'load' });

  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    ),
  ).toBeGreaterThan(400);
  expect(applicationChunkRequested).toBe(false);
});

test('a normal refresh restores the previous homepage position', async ({ page }) => {
  await page.goto('/');
  const target = await scrollToTarget(page);

  await page.reload({ waitUntil: 'load' });

  await expectScrollNear(page, target);
});

test('rapid repeated hard refreshes preserve the last stable position', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback =>
      nativeRequestAnimationFrame(timestamp => {
        setTimeout(() => callback(timestamp), 250);
      });
  });

  await page.goto('/');
  const target = await scrollToTarget(page);

  await hardReload(page);
  await waitForScrollableDocument(page);
  await hardReload(page);
  await waitForScrollableDocument(page);
  await hardReload(page);
  await waitForScrollableDocument(page);

  await expectScrollNear(page, target);
});

test('user scrolling after refresh remains authoritative', async ({ page }) => {
  await page.goto('/');
  await scrollToTarget(page);
  await page.reload({ waitUntil: 'load' });
  await waitForScrollableDocument(page);

  const userTarget = 240;
  await page.dispatchEvent('body', 'pointerdown');
  await page.evaluate(y => window.scrollTo(0, y), userTarget);
  const userPosition = await page.evaluate(() => Math.round(window.scrollY));
  expect(userPosition).toBe(userTarget);

  await page.waitForTimeout(500);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(userPosition);
});

test('an in-app route change starts at the top', async ({ page }) => {
  await page.goto('/');
  await scrollToTarget(page);

  await page.locator('a[href="/contact"]').first().click();

  await expect(page).toHaveURL(/\/contact$/);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
});

test('cross-route section navigation scrolls once without retry polling', async ({ page }) => {
  await page.goto('/contact');

  await page.locator('a[href="/#services"]:visible').first().click();

  await expect(page).toHaveURL(/\/#services$/);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const top = document.getElementById('services')?.getBoundingClientRect().top;
        return top !== undefined && Math.abs(top) <= 80;
      }),
    )
    .toBe(true);
});
