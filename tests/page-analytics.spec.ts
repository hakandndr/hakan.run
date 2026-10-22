import { test, expect, type Page } from '@playwright/test';
import { NOTE_SLUGS } from '../apps/web/src/notes/manifest.js';

// PAGE events in the browser (D-050): a public page sends one; a removed
// project page, an unknown note or any other 404 sends none. The browser
// resolves hakan.run to the local Worker document server, so the page runs on
// the tracked hostname; every PAGE request is answered here and never reaches
// a database.
const ORIGIN = 'http://hakan.run:4175';

test.use({ launchOptions: { args: ['--host-resolver-rules=MAP hakan.run 127.0.0.1'] } });

const recordBeacons = async (page: Page) => {
  const beacons: string[] = [];
  await page.route('**/api/analytics/page', async (route) => {
    beacons.push(JSON.parse(route.request().postData() ?? '{}').path);
    await route.fulfill({ status: 202, contentType: 'application/json', body: '{"status":"recorded"}' });
  });
  await page.route('**/api/analytics/outbound**', (route) => route.abort());
  return beacons;
};

// PageTracker runs in hydrated React; wait for React to own the document.
const hydrated = (page: Page) => expect.poll(() => page.evaluate(() => {
  const node = document.querySelector('#root h1');
  return !!node && Object.keys(node).some((key) => key.startsWith('__reactFiber'));
})).toBe(true);

const navigateInApp = (page: Page, path: string) => page.evaluate((target) => {
  window.history.pushState({}, '', target);
  window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
}, path);

const NOT_FOUND = 'no such file or directory';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('booted', '1');
    // The real site is HTTPS, where crypto.randomUUID exists; this plain-HTTP
    // test origin is not a secure context, so provide the same RFC 4122 v4 value.
    if (typeof crypto.randomUUID !== 'function') {
      Object.defineProperty(crypto, 'randomUUID', {
        value: () => {
          const bytes = crypto.getRandomValues(new Uint8Array(16));
          bytes[6] = (bytes[6] & 0x0f) | 0x40;
          bytes[8] = (bytes[8] & 0x3f) | 0x80;
          const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
          return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        },
      });
    }
  });
});

test('in-app navigation to a removed project page sends no PAGE event; pages around it do', async ({ page }) => {
  const beacons = await recordBeacons(page);
  await page.goto(`${ORIGIN}/`);
  await hydrated(page);
  expect(await page.evaluate(() => window.location.hostname)).toBe('hakan.run');
  await expect.poll(() => beacons).toEqual(['/']);

  await navigateInApp(page, '/project/example');
  await expect(page.getByText(NOT_FOUND)).toBeVisible();
  await navigateInApp(page, '/notes/not-a-real-note');
  await expect(page.getByText(NOT_FOUND)).toBeVisible();

  await navigateInApp(page, '/notes');
  await expect(page.locator('[data-public-section="notes-index"]')).toBeVisible();
  await expect.poll(() => beacons).toEqual(['/', '/notes']);
});

for (const path of ['/project/example', '/project/full-stack-development', '/notes/not-a-real-note', '/no-such-page']) {
  test(`a direct request for ${path} is a noindex 404 that sends no PAGE event`, async ({ page }) => {
    const beacons = await recordBeacons(page);
    const response = await page.goto(`${ORIGIN}${path}`);
    expect(response!.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await hydrated(page);
    await expect(page.getByText(NOT_FOUND)).toBeVisible();
    // A later in-app move to a page proves the tracker is live on this document.
    await navigateInApp(page, '/contact');
    await expect(page.locator('form')).toBeVisible();
    await expect.poll(() => beacons).toEqual(['/contact']);
  });
}

test('every public page sends exactly one PAGE event for its own path', async ({ page }) => {
  const beacons = await recordBeacons(page);
  const pages = ['/', '/card', '/contact', '/notes', `/notes/${NOTE_SLUGS[0]}`];
  for (const path of pages) {
    await page.goto(`${ORIGIN}${path}`);
    await hydrated(page);
    await expect.poll(() => beacons.at(-1)).toBe(path);
  }
  expect(beacons).toEqual(pages);
});
