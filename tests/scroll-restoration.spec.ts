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

// The public site's only REPLACE navigation was the client /admin redirect to
// the homepage; /admin is now an HTTP 404 (tests/http-routes.spec.ts), so PUSH
// is the navigation left to pin here.
test('PUSH performs one intended top scroll', async ({ page }) => {
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
});

// The homepage links to /contact only from the footer. Clicking a link outside
// the viewport makes Playwright scroll the page first, which is a real move
// away from the position a test saved, so the POP tests leave from a measured
// position at which the footer link is already in view.
const footerContactLink = (page: Page) => page.locator('footer a[href="/contact"]');

const scrollToRevealFooterContact = async (page: Page) => {
  const y = await footerContactLink(page).evaluate((link) => {
    const rect = link.getBoundingClientRect();
    const bottom = rect.bottom + window.scrollY;
    // Just below the link's bottom edge, short of the end of the page, so the
    // restored value cannot be produced by clamping to the maximum.
    return Math.ceil(bottom + 40 - window.innerHeight);
  });
  const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  expect(y).toBeGreaterThan(0);
  expect(y).toBeLessThan(max);
  await scrollAndSave(page, y);
  await expect(footerContactLink(page)).toBeInViewport({ ratio: 1 });
  return y;
};

test('POP restores the destination entry while hash PUSH scrolls exactly once', async ({ page }) => {
  await installScrollCallLog(page);
  await page.goto('/');
  await waitForPublishedSite(page);
  const departure = await scrollToRevealFooterContact(page);

  await footerContactLink(page).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expectScroll(page, 0);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expectScroll(page, departure);

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

test('POP restores the position the entry was left at, even when leaving in the same frame as the last scroll', async ({ page }) => {
  // A scroll event arrives up to a frame after the movement. Scrolling and
  // following a link in one task leaves before that event, so the entry's
  // position must be recorded at departure rather than from scroll events.
  await page.goto('/');
  await waitForPublishedSite(page);
  await scrollAndSave(page);
  const departure = await page.evaluate(() => {
    const y = 1500;
    window.scrollTo(0, y);
    document.querySelector<HTMLAnchorElement>('footer a[href="/contact"]')!.click();
    return y;
  });
  await expect(page).toHaveURL(/\/contact$/);
  await expectScroll(page, 0);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expectScroll(page, departure);
});

declare global {
  interface Window {
    __scrollCalls: Array<{ kind: string; id?: string; args: unknown[] }>;
  }
}
