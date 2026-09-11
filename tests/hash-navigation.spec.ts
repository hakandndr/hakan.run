import { expect, test, type Page } from '@playwright/test';
import {
  fulfillPublishedContent,
  isolatePublicWrites,
  waitForPublishedSite,
} from './helpers/published-content';

type ScrollCall = { kind: 'scrollIntoView'; id: string } | { kind: 'scrollTo' };

const installNavigationLog = async (page: Page) => {
  await page.addInitScript(() => {
    const nativeScrollTo = window.scrollTo.bind(window);
    const nativeScrollIntoView = Element.prototype.scrollIntoView;
    window.__hashNavigationLog = { scrollCalls: [], pushCount: 0, replaceCount: 0 };

    const nativePushState = window.history.pushState.bind(window.history);
    const nativeReplaceState = window.history.replaceState.bind(window.history);
    window.history.pushState = (...args) => {
      window.__hashNavigationLog.pushCount += 1;
      return nativePushState(...args);
    };
    window.history.replaceState = (...args) => {
      window.__hashNavigationLog.replaceCount += 1;
      return nativeReplaceState(...args);
    };
    window.scrollTo = (...args) => {
      window.__hashNavigationLog.scrollCalls.push({ kind: 'scrollTo' });
      nativeScrollTo(...args);
    };
    Element.prototype.scrollIntoView = function (...args) {
      window.__hashNavigationLog.scrollCalls.push({ kind: 'scrollIntoView', id: this.id });
      nativeScrollIntoView.apply(this, args);
    };
  });
};

const expectSectionAligned = async (page: Page, id: string) => {
  await expect.poll(() => page.evaluate((sectionId) => {
    const section = document.getElementById(sectionId);
    return section ? Math.abs(section.getBoundingClientRect().top) : Number.MAX_SAFE_INTEGER;
  }, id)).toBeLessThanOrEqual(80);
};

const clickHeaderHash = async (page: Page, id: string) => {
  const before = await page.evaluate(() => ({
    key: window.history.state?.key,
    index: window.history.state?.idx,
    scrollCalls: window.__hashNavigationLog.scrollCalls.length,
  }));

  await page.locator(`header a[href="/#${id}"]:visible`).first().click();
  await expect(page).toHaveURL(new RegExp(`/#${id}$`));
  await expectSectionAligned(page, id);

  const after = await page.evaluate(() => ({
    key: window.history.state?.key,
    index: window.history.state?.idx,
    scrollCalls: window.__hashNavigationLog.scrollCalls,
  }));
  expect(after.key).not.toBe(before.key);
  expect(after.index).toBe(before.index + 1);
  expect(after.scrollCalls.slice(before.scrollCalls)).toEqual([
    { kind: 'scrollIntoView', id },
  ]);
};

test.beforeEach(async ({ page }) => {
  await isolatePublicWrites(page);
  await page.route('**/api/content', fulfillPublishedContent);
  await page.addInitScript(() => {
    window.sessionStorage.setItem('hakan.run:boot-intro-seen', '1');
  });
  await installNavigationLog(page);
});

test('sequential and reverse hash PUSH navigation remains deterministic', async ({ page }) => {
  await page.goto('/');
  await waitForPublishedSite(page);

  for (const id of ['portfolio', 'services', 'about', 'services', 'portfolio', 'about']) {
    await clickHeaderHash(page, id);
  }
});

test('same hash twice does not poison the following navigation', async ({ page }) => {
  await page.goto('/');
  await waitForPublishedSite(page);

  await clickHeaderHash(page, 'portfolio');
  await clickHeaderHash(page, 'portfolio');
  await clickHeaderHash(page, 'services');
});

test('Back and Forward restore hash entries without a second section scroll', async ({ page }) => {
  await page.goto('/');
  await waitForPublishedSite(page);
  await clickHeaderHash(page, 'portfolio');
  await clickHeaderHash(page, 'services');
  await clickHeaderHash(page, 'about');

  let callCount = await page.evaluate(() => window.__hashNavigationLog.scrollCalls.length);
  await page.goBack();
  await expect(page).toHaveURL(/\/#services$/);
  await expectSectionAligned(page, 'services');
  expect(await page.evaluate((start) => window.__hashNavigationLog.scrollCalls.slice(start), callCount))
    .toEqual([{ kind: 'scrollTo' }]);

  callCount = await page.evaluate(() => window.__hashNavigationLog.scrollCalls.length);
  await page.goBack();
  await expect(page).toHaveURL(/\/#portfolio$/);
  await expectSectionAligned(page, 'portfolio');
  expect(await page.evaluate((start) => window.__hashNavigationLog.scrollCalls.slice(start), callCount))
    .toEqual([{ kind: 'scrollTo' }]);

  callCount = await page.evaluate(() => window.__hashNavigationLog.scrollCalls.length);
  await page.goForward();
  await expect(page).toHaveURL(/\/#services$/);
  await expectSectionAligned(page, 'services');
  expect(await page.evaluate((start) => window.__hashNavigationLog.scrollCalls.slice(start), callCount))
    .toEqual([{ kind: 'scrollTo' }]);
});

test('smooth scrolling does not flood the History API', async ({ page }) => {
  await page.goto('/');
  await waitForPublishedSite(page);
  const initialReplaceCount = await page.evaluate(() => window.__hashNavigationLog.replaceCount);

  await clickHeaderHash(page, 'portfolio');
  await expect.poll(() => page.evaluate(() => window.__hashNavigationLog.replaceCount))
    .toBeGreaterThan(initialReplaceCount);

  const counts = await page.evaluate(() => ({
    pushes: window.__hashNavigationLog.pushCount,
    replaces: window.__hashNavigationLog.replaceCount,
  }));
  expect(counts.pushes).toBe(1);
  expect(counts.replaces - initialReplaceCount).toBeLessThanOrEqual(2);
});

test('Hero, Footer, and pathname navigation share the public navigation owner', async ({ page }) => {
  await page.goto('/');
  await waitForPublishedSite(page);

  let callCount = await page.evaluate(() => window.__hashNavigationLog.scrollCalls.length);
  await page.getByRole('button', { name: 'View Projects' }).click();
  await expect(page).toHaveURL(/\/#portfolio$/);
  await expectSectionAligned(page, 'portfolio');
  expect(await page.evaluate((start) => window.__hashNavigationLog.scrollCalls.slice(start), callCount))
    .toEqual([{ kind: 'scrollIntoView', id: 'portfolio' }]);

  callCount = await page.evaluate(() => window.__hashNavigationLog.scrollCalls.length);
  await page.locator('footer a[href="/#services"]').click();
  await expect(page).toHaveURL(/\/#services$/);
  await expectSectionAligned(page, 'services');
  expect(await page.evaluate((start) => window.__hashNavigationLog.scrollCalls.slice(start), callCount))
    .toEqual([{ kind: 'scrollIntoView', id: 'services' }]);

  await page.getByRole('button', { name: "Let's Run" }).first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator('form')).toBeVisible();
});

declare global {
  interface Window {
    __hashNavigationLog: {
      scrollCalls: ScrollCall[];
      pushCount: number;
      replaceCount: number;
    };
  }
}
