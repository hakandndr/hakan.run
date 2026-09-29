import { test, expect, type Browser, type Page } from '@playwright/test';

// First-paint invariant: the document the browser paints before any module
// script runs must be the same page anatomy the hydrated application settles
// on. These tests run against the real Worker (tests/support/document-server.mjs),
// because a static preview server never shows what the Worker sends.
const DOCUMENT_ORIGIN = 'http://localhost:4175';
const PAGES = [
  '/',
  '/notes',
  '/notes/a-write-path-for-a-mostly-static-site',
  '/notes/why-the-status-page-ignores-single-failed-probes',
  '/contact',
  '/card',
];

// Layout without CSS transforms (entrance motion translates, it does not
// relayout), plus the typographic values a font or stylesheet swap would change.
const signature = () => {
  const layout = (element: Element | null) => {
    if (!(element instanceof HTMLElement)) return null;
    let top = 0;
    let left = 0;
    for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
      top += node.offsetTop;
      left += node.offsetLeft;
    }
    const style = getComputedStyle(element);
    return {
      top, left, width: element.offsetWidth, height: element.offsetHeight,
      font: style.fontFamily, size: style.fontSize, weight: style.fontWeight, lineHeight: style.lineHeight,
    };
  };
  const root = document.getElementById('root');
  return {
    header: layout(root?.querySelector('header') ?? null),
    main: layout(root?.querySelector('main') ?? null),
    h1: layout(root?.querySelector('h1') ?? null),
    h1Text: root?.querySelector('h1')?.textContent?.trim() ?? null,
    firstParagraph: layout(root?.querySelector('main p, article p') ?? null),
    sections: [...(root?.querySelectorAll('[data-public-section]') ?? [])].map((element) => element.getAttribute('data-public-section')),
    footer: layout(root?.querySelector('footer') ?? null),
  };
};

const withoutScripts = async (browser: Browser, path: string, isMobile: boolean, viewport: { width: number; height: number } | null) => {
  const context = await browser.newContext({ javaScriptEnabled: false, isMobile, viewport });
  const page = await context.newPage();
  const response = await page.goto(`${DOCUMENT_ORIGIN}${path}`);
  const result = { status: response?.status(), signature: await page.evaluate(signature) };
  await context.close();
  return result;
};

const recordBeforeModules = async (page: Page) => {
  await page.addInitScript(`(${(source: string) => {
    window.sessionStorage.setItem('hakan.run:boot-intro-seen', '1');
    document.addEventListener('readystatechange', () => {
      if (document.readyState !== 'interactive') return;
      const w = window as unknown as Record<string, unknown>;
      // Deferred module scripts have not executed yet at this point.
      w.__beforeModules = (0, eval)(source)();
      w.__firstPaintNode = document.getElementById('root')?.firstElementChild ?? null;
    });
  }})(${JSON.stringify(`(${signature.toString()})`)})`);
};

for (const path of PAGES) {
  test(`first paint and hydrated page share one anatomy: ${path}`, async ({ page, browser, isMobile, viewport }) => {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    const contentRequests: string[] = [];
    page.on('request', (request) => { if (request.url().includes('/api/content')) contentRequests.push(request.url()); });
    await page.route('**/api/analytics/page', (route) => route.fulfill({ status: 202, body: '{}' }));
    await recordBeforeModules(page);

    const response = await page.goto(`${DOCUMENT_ORIGIN}${path}`, { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await page.waitForTimeout(1200);

    const result = await page.evaluate(`(() => ({
      before: window.__beforeModules,
      after: (${signature.toString()})(),
      sameNode: !!window.__firstPaintNode && window.__firstPaintNode === document.getElementById('root').firstElementChild,
    }))()`) as { before: ReturnType<typeof signature>; after: ReturnType<typeof signature>; sameNode: boolean };

    // The painted markup is the server-rendered application, not a placeholder.
    expect(result.before.h1Text, 'first paint has the page heading').toBeTruthy();
    // /card is a standalone page without the site header and footer.
    if (path !== '/card') {
      expect(result.before.header, 'first paint has the site header').not.toBeNull();
      expect(result.before.footer, 'first paint has the site footer').not.toBeNull();
    }
    // Hydration attaches to that markup instead of replacing it.
    expect(result.sameNode, 'hydration preserved the painted DOM').toBe(true);
    // Contact mounts the Turnstile widget after hydration by design, which
    // changes the page height below the form; everything else must match.
    const comparable = (value: ReturnType<typeof signature>) => (path === '/contact' ? { ...value, main: null, footer: null } : value);
    expect(comparable(result.after)).toEqual(comparable(result.before));
    // No second content round-trip and no hydration mismatch.
    expect(contentRequests).toEqual([]);
    expect(errors).toEqual([]);

    // Without JavaScript the document is the same page.
    const noScript = await withoutScripts(browser, path, isMobile, viewport);
    expect(noScript.status).toBe(200);
    expect(comparable(noScript.signature)).toEqual(comparable(result.before));
  });
}

test('unknown Notes slug stays a first-party HTTP 404 through the Worker', async ({ request }) => {
  const response = await request.get(`${DOCUMENT_ORIGIN}/notes/not-a-real-note`, { maxRedirects: 0 });
  expect(response.status()).toBe(404);
  expect(await response.text()).toContain('404 — Note not found');
});

test('server-rendered navigation keeps the soft route transition', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('hakan.run:boot-intro-seen', '1');
    const w = window as unknown as { __transitions: number };
    w.__transitions = 0;
    const original = document.startViewTransition?.bind(document);
    if (original) document.startViewTransition = ((update: () => void) => { w.__transitions += 1; return original(update); }) as typeof document.startViewTransition;
  });
  await page.route('**/api/analytics/page', (route) => route.fulfill({ status: 202, body: '{}' }));
  await page.goto(`${DOCUMENT_ORIGIN}/notes`, { waitUntil: 'load' });
  const header = page.locator('header').first();
  await header.evaluate((element) => { element.dataset.probe = 'persistent'; });
  await page.getByRole('link', { name: /Reachable is not current/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Reachable is not current' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();
  await expect(header).toHaveAttribute('data-probe', 'persistent');
  expect(await page.evaluate(() => (window as unknown as { __transitions: number }).__transitions)).toBe(2);
});
