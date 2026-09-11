import { expect, test, type Page } from '@playwright/test';
import {
  fulfillPublishedContent,
  isolatePublicWrites,
  publishedContentResponse,
  waitForPublishedSite,
} from './helpers/published-content';

const target = 1200;

const installScrollCallLog = async (page: Page) => {
  await page.addInitScript(() => {
    const nativeScrollTo = window.scrollTo.bind(window);
    const nativeScrollIntoView = Element.prototype.scrollIntoView;
    window.__scrollCalls = [];
    window.scrollTo = (...args) => {
      window.__scrollCalls.push({ kind: 'scrollTo', args });
      nativeScrollTo(...args);
    };
    Element.prototype.scrollIntoView = function (...args) {
      window.__scrollCalls.push({ kind: 'scrollIntoView', id: this.id, args });
      nativeScrollIntoView.apply(this, args);
    };
  });
};

const hardReload = async (page: Page) => {
  const session = await page.context().newCDPSession(page);
  const loaded = page.waitForEvent('load');
  await session.send('Page.reload', { ignoreCache: true });
  await loaded;
  await session.detach();
};

const scrollAndSave = async (page: Page, y = target) => {
  await page.evaluate(value => window.scrollTo(0, value), y);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(y);
  await expect.poll(() => page.evaluate(() => window.history.state?.__hakanRunScroll?.y)).toBe(y);
};

const expectScroll = async (page: Page, y = target) => {
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(y);
};

test.beforeEach(async ({ page }) => {
  await isolatePublicWrites(page);
  await page.route('**/api/content', fulfillPublishedContent);
});

test('normal refresh restores once from the current history entry', async ({ page }) => {
  await page.goto('/');
  await waitForPublishedSite(page);
  await scrollAndSave(page);

  await page.reload({ waitUntil: 'load' });
  await waitForPublishedSite(page);

  await expectScroll(page);
  expect(await page.evaluate(() => window.history.scrollRestoration)).toBe('manual');
});

test('hard refresh restores once from the current history entry', async ({ page }) => {
  await page.goto('/');
  await waitForPublishedSite(page);
  await scrollAndSave(page);

  await hardReload(page);
  await waitForPublishedSite(page);

  await expectScroll(page);
});

test('repeated hard refresh never replaces a stable position with transient zero', async ({ page }) => {
  let requests = 0;
  let releaseReload: (() => void) | undefined;
  const reloadGate = new Promise<void>(resolve => { releaseReload = resolve; });
  await page.unroute('**/api/content');
  await page.route('**/api/content', async route => {
    requests += 1;
    if (requests === 2) await reloadGate;
    await route.fulfill(publishedContentResponse);
  });

  await page.goto('/');
  await waitForPublishedSite(page);
  await scrollAndSave(page);

  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('[data-public-bootstrap="loading"]')).toBeVisible();
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  expect(await page.evaluate(() => window.history.state.__hakanRunScroll.y)).toBe(target);

  releaseReload?.();
  await waitForPublishedSite(page);
  await expectScroll(page);
  expect(await page.evaluate(() => window.history.state.__hakanRunScroll.y)).toBe(target);

  await hardReload(page);
  await waitForPublishedSite(page);
  await expectScroll(page);
  expect(await page.evaluate(() => window.history.state.__hakanRunScroll.y)).toBe(target);
});

test('direct user scrolling after READY is never replayed over', async ({ page }) => {
  await page.goto('/');
  await waitForPublishedSite(page);
  await scrollAndSave(page);
  await page.reload({ waitUntil: 'load' });
  await waitForPublishedSite(page);
  await expectScroll(page);

  await page.dispatchEvent('body', 'pointerdown');
  await scrollAndSave(page, 240);

  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(240);
  expect(await page.evaluate(() => window.history.state.__hakanRunScroll.y)).toBe(240);
});

test('PUSH and REPLACE each perform one intended top scroll', async ({ page }) => {
  await installScrollCallLog(page);
  await page.goto('/');
  await waitForPublishedSite(page);
  await scrollAndSave(page);
  await page.evaluate(() => { window.__scrollCalls = []; });

  await page.locator('a[href="/contact"]').first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expectScroll(page, 0);
  expect(await page.evaluate(() => window.__scrollCalls)).toEqual([
    { kind: 'scrollTo', args: [{ top: 0, left: 0, behavior: 'auto' }] },
  ]);

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/$/);
  await waitForPublishedSite(page);
  const replaceCalls = await page.evaluate(() => window.__scrollCalls);
  expect(replaceCalls.filter(call => call.kind === 'scrollTo')).toHaveLength(1);
});

test('POP restores the destination entry while hash PUSH scrolls exactly once', async ({ page }) => {
  await installScrollCallLog(page);
  await page.goto('/');
  await waitForPublishedSite(page);
  await scrollAndSave(page);

  await page.locator('a[href="/contact"]').first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expectScroll(page, 0);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expectScroll(page);

  await page.locator('a[href="/contact"]').first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator('form')).toBeVisible();
  await expectScroll(page, 0);
  await page.evaluate(() => { window.__scrollCalls = []; });
  await page.locator('a[href="/#services"]:visible').first().click();
  await expect(page).toHaveURL(/\/#services$/);
  await waitForPublishedSite(page);
  await expect.poll(() => page.evaluate(() => {
    const section = document.getElementById('services');
    return section ? Math.abs(section.getBoundingClientRect().top) : Number.MAX_SAFE_INTEGER;
  })).toBeLessThanOrEqual(80);
  expect(await page.evaluate(() => window.__scrollCalls)).toEqual([
    { kind: 'scrollIntoView', id: 'services', args: [{ behavior: 'smooth' }] },
  ]);
});

declare global {
  interface Window {
    __scrollCalls: Array<{ kind: string; id?: string; args: unknown[] }>;
  }
}
