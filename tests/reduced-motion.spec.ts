import { test, expect, type Page } from '@playwright/test';
import { fulfillPublishedContent, isolatePublicWrites, waitForPublishedSite } from './helpers/published-content';

// The framer-motion reduced-motion contract (components/MotionPreference.jsx):
// with `prefers-reduced-motion: reduce`, nothing visible moves; elements still
// fade in and stay usable. Each probe also runs without the preference, where
// the same elements must move, so a probe that cannot observe motion fails.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('booted', '1'));
  await page.route('**/api/content', fulfillPublishedContent);
  await isolatePublicWrites(page);
});

type Sample = { present: boolean; opacity: number; offset: number };

// Sample one element on every animation frame: whether it exists, its
// opacity, and how far its transform moves it from its resting place.
const startSampling = (page: Page, locate: string) => page.evaluate((source) => {
  const find = new Function(`return (${source})();`) as () => Element | null;
  const w = window as unknown as { __samples: Sample[]; __sampling: boolean };
  w.__samples = [];
  w.__sampling = true;
  const tick = () => {
    const element = find();
    if (!element) {
      w.__samples.push({ present: false, opacity: 0, offset: 0 });
    } else {
      const style = getComputedStyle(element);
      const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
      w.__samples.push({ present: true, opacity: Number(style.opacity), offset: Math.abs(matrix.m41) + Math.abs(matrix.m42) });
    }
    if (w.__sampling) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}, locate);

const stopSampling = (page: Page) => page.evaluate(() => {
  const w = window as unknown as { __samples: Sample[]; __sampling: boolean };
  w.__sampling = false;
  return w.__samples;
});

// Frames in which the element was visible and displaced from its resting place.
const movingVisibleFrames = (samples: Sample[]) =>
  samples.filter((sample) => sample.present && sample.opacity > 0.01 && sample.offset > 0.5).length;

const PORTFOLIO_ENTRANCE = '() => document.getElementById("portfolio")?.parentElement ?? null';

const sampleSectionEntrance = async (page: Page, reducedMotion: 'reduce' | 'no-preference') => {
  await page.emulateMedia({ reducedMotion });
  await page.goto('/');
  await waitForPublishedSite(page);
  const entrance = page.locator('#portfolio').locator('xpath=..');
  await expect(entrance).toHaveCSS('opacity', '0');
  await startSampling(page, PORTFOLIO_ENTRANCE);
  await entrance.evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2, behavior: 'instant' }));
  await expect(entrance).toHaveCSS('opacity', '1');
  await expect(entrance).toHaveCSS('transform', 'none');
  return stopSampling(page);
};

test('section entrances move into place by default', async ({ page }) => {
  expect(movingVisibleFrames(await sampleSectionEntrance(page, 'no-preference'))).toBeGreaterThan(3);
});

test('section entrances fade in without moving when reduced motion is preferred', async ({ page }) => {
  const samples = await sampleSectionEntrance(page, 'reduce');
  expect(movingVisibleFrames(samples)).toBe(0);
  // It still fades in rather than appearing in one frame.
  expect(samples.some((sample) => sample.opacity > 0.01 && sample.opacity < 0.99)).toBe(true);
});

test.describe('mobile menu', () => {
  // The menu exists below `md`; both projects run it at a phone width.
  test.use({ viewport: { width: 390, height: 844 } });

  const MENU = '() => document.getElementById("public-mobile-menu")';

  const sampleMenu = async (page: Page, reducedMotion: 'reduce' | 'no-preference') => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    await waitForPublishedSite(page);
    await startSampling(page, MENU);
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const menu = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(menu).toBeVisible();
    await expect(page.locator('#public-mobile-menu')).toHaveCSS('opacity', '1');
    // At rest (an identity matrix or no transform).
    await expect.poll(async () => (await page.evaluate(() => {
      const transform = getComputedStyle(document.getElementById('public-mobile-menu')!).transform;
      const matrix = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
      return Math.abs(matrix.m41) + Math.abs(matrix.m42);
    }))).toBe(0);
    const samples = await stopSampling(page);

    // Choosing a link still navigates and closes the menu.
    await menu.locator('a[href="/#about"]').click();
    await expect(page).toHaveURL(/\/#about$/);
    await expect(page.locator('#public-mobile-menu')).toHaveCount(0);
    return samples;
  };

  test('the menu slides in by default', async ({ page }) => {
    expect(movingVisibleFrames(await sampleMenu(page, 'no-preference'))).toBeGreaterThan(3);
  });

  test('the menu fades in without sliding when reduced motion is preferred, and still works', async ({ page }) => {
    expect(movingVisibleFrames(await sampleMenu(page, 'reduce'))).toBe(0);
  });

  test('menu links do not slide in when reduced motion is preferred', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForPublishedSite(page);
    await startSampling(page, '() => document.querySelector(\'nav[aria-label="Mobile navigation"] a\')');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const link = page.getByRole('navigation', { name: 'Mobile navigation' }).locator('a').first();
    await expect(link).toHaveCSS('opacity', '1');
    expect(movingVisibleFrames(await stopSampling(page))).toBe(0);
  });
});

test('a server-rendered document hydrates in place with reduced motion preferred', async ({ page }) => {
  // The preference changes animations only, never the rendered markup, so the
  // painted heading is the hydrated one.
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    new MutationObserver((_, observer) => {
      const heading = document.querySelector('#root h1');
      if (!heading) return;
      (window as unknown as { __painted: Element }).__painted = heading;
      observer.disconnect();
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('http://localhost:4175/', { waitUntil: 'networkidle' });
  await expect(page.locator('#services')).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const heading = document.querySelector('#root h1');
    return !!heading && Object.keys(heading).some((key) => key.startsWith('__reactFiber'));
  })).toBe(true);
  expect(await page.evaluate(() => (window as unknown as { __painted: Element }).__painted.isConnected)).toBe(true);
  expect(errors).toEqual([]);
});
