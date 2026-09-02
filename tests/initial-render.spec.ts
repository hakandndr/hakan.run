import { expect, test } from '@playwright/test';

// Initial-render architecture.
//
// A load that already holds known-good content must render it immediately and
// must not change afterwards: that stability is what lets the browser's own
// scroll restoration work, and it is why no manual scroll machinery exists.

declare global {
  interface Window {
    __SUPABASE_RUNTIME_CONFIG__?: { url: string; key: string };
  }
}

const HERO = {
  badge: 'CACHED HERO BADGE',
  headingLine1: 'CACHED HERO LINE ONE',
  headingLine2: 'CACHED HERO LINE TWO',
  paragraph: 'CACHED HERO PARAGRAPH',
  primaryButton: 'CACHED PRIMARY',
  primaryButtonHref: '#portfolio',
  secondaryButton: 'CACHED SECONDARY',
  secondaryButtonHref: '/contact',
  profile: {
    image: '/media/HakanDundar.webp',
    imageAlt: 'Cached hero image',
    name: 'CACHED PROFILE',
    role: 'CACHED ROLE',
    location: 'CACHED LOCATION',
    topValue: 'CACHED TOP',
    topLabel: 'CACHED TOP LABEL',
    bottomLabel: 'CACHED BOTTOM LABEL',
    bottomValue: 'CACHED BOTTOM',
  },
};

const ROWS = JSON.stringify([{ section: 'hero', data: HERO }]);

// Publish a Supabase runtime configuration before boot so the Supabase-backed
// code path runs deterministically with or without build-time environment
// variables. Every request to it is intercepted; no real service is contacted.
const bootWithCachedContent = (hero: typeof HERO) => {
  window.__SUPABASE_RUNTIME_CONFIG__ = {
    url: 'https://supabase.e2e.test',
    key: 'e2e-anon-key',
  };
  window.sessionStorage.setItem('booted', '1');
  window.localStorage.setItem('siteContent', JSON.stringify({ hero }));
};

const bootWithoutCachedContent = () => {
  window.__SUPABASE_RUNTIME_CONFIG__ = {
    url: 'https://supabase.e2e.test',
    key: 'e2e-anon-key',
  };
  window.sessionStorage.setItem('booted', '1');
  window.localStorage.removeItem('siteContent');
};

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost:3000)/, route => {
    if (route.request().url().includes('/rest/v1/site_content')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: ROWS });
    }
    return route.abort();
  });
});

test('a cached load renders immediately and is never gated', async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });

  await page.route('**/rest/v1/site_content*', async route => {
    await gate;
    await route.fulfill({ status: 200, contentType: 'application/json', body: ROWS });
  });

  await page.addInitScript(bootWithCachedContent, HERO);
  await page.goto('/');

  // Content is on screen before Supabase has answered.
  await expect(page.getByText('CACHED HERO BADGE', { exact: true })).toBeVisible();
  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);

  release();
  await expect(page.getByText('CACHED HERO BADGE', { exact: true })).toBeVisible();
});

test('the document height does not change once Supabase confirms the content', async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });

  await page.route('**/rest/v1/site_content*', async route => {
    await gate;
    await route.fulfill({ status: 200, contentType: 'application/json', body: ROWS });
  });

  await page.addInitScript(bootWithCachedContent, HERO);
  await page.goto('/');
  await expect(page.getByText('CACHED HERO BADGE', { exact: true })).toBeVisible();

  // Let images and fonts settle first, so this measures content-driven layout
  // change only and not ordinary asset loading.
  await page.waitForTimeout(1_000);
  const before = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(before).toBeGreaterThan(page.viewportSize()!.height);

  release();
  await page.waitForTimeout(800);

  const after = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(after).toBe(before);
});

test('a successful Supabase read is persisted for the next load', async ({ page }) => {
  await page.addInitScript(bootWithoutCachedContent);
  await page.goto('/');
  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);

  await expect
    .poll(() => page.evaluate(() => {
      const stored = JSON.parse(window.localStorage.getItem('siteContent') || 'null');
      return stored?.hero?.badge ?? null;
    }))
    .toBe(HERO.badge);
});

test('scroll restoration is left to the browser', async ({ page }) => {
  await page.addInitScript(bootWithCachedContent, HERO);
  await page.goto('/');
  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);
  expect(await page.evaluate(() => history.scrollRestoration)).toBe('auto');
});

test('the app does not move the scroll position on an initial load', async ({ page }) => {
  await page.addInitScript(bootWithCachedContent, HERO);
  await page.goto('/');
  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);

  const target = await page.evaluate(() => {
    const y = Math.min(900, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, y);
    return Math.round(window.scrollY);
  });
  expect(target).toBeGreaterThan(0);

  // Nothing in the app may reset or re-apply a position after the initial load.
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(target);
});

test('an in-app route change still scrolls to the top', async ({ page }) => {
  await page.addInitScript(bootWithCachedContent, HERO);
  await page.goto('/');
  await expect(page.locator('[data-content-ready="true"]')).toHaveCount(1);

  await page.evaluate(() => window.scrollTo(0, 600));
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(0);

  await page.locator('a[href="/contact"]').first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
});

test('an uncached first visit is still gated against stale source content', async ({ page }) => {
  let release: () => void = () => {};
  let started: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  const requestStarted = new Promise<void>(resolve => { started = resolve; });

  await page.route('**/rest/v1/site_content*', async route => {
    started();
    await gate;
    await route.fulfill({ status: 200, contentType: 'application/json', body: ROWS });
  });

  await page.addInitScript(bootWithoutCachedContent);
  await page.goto('/');
  await requestStarted;

  await expect(page.locator('[data-content-ready="false"]')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /BUILD\. DEPLOY\. RUN\./ }).first()).not.toBeVisible();

  release();
  await expect(page.getByText('CACHED HERO BADGE', { exact: true })).toBeVisible();
});
