import { test, expect, type Page } from '@playwright/test';

// The HTTP contract of every kind of path, read from the real Worker over the
// built assets (tests/support/document-server.mjs reproduces Cloudflare's
// asset-first dispatch for this configuration). Only pages are 200; nothing
// unknown may come back as a 200 copy of the application shell.
const ORIGIN = 'http://localhost:4175';

type Expectation = { status: number; type: RegExp; robots?: string | null; canonical?: string | null };
const ROUTES: Record<string, Expectation> = {
  '/': { status: 200, type: /^text\/html/, robots: 'index, follow', canonical: 'https://hakan.run/' },
  '/contact': { status: 200, type: /^text\/html/, robots: 'index, follow', canonical: 'https://hakan.run/contact' },
  '/card': { status: 200, type: /^text\/html/, robots: 'index, follow', canonical: 'https://hakan.run/card' },
  '/notes': { status: 200, type: /^text\/html/, robots: 'index, follow', canonical: 'https://hakan.run/notes' },
  '/notes/reachable-is-not-current': { status: 200, type: /^text\/html/, robots: 'index, follow', canonical: 'https://hakan.run/notes/reachable-is-not-current' },
  '/notes/not-a-real-note': { status: 404, type: /^text\/html/, robots: 'noindex', canonical: null },
  '/project/nonexistent': { status: 404, type: /^text\/html/, robots: 'noindex', canonical: null },
  '/project/full-stack-development': { status: 404, type: /^text\/html/, robots: 'noindex', canonical: null },
  '/nonexistent-path': { status: 404, type: /^text\/html/, robots: 'noindex', canonical: null },
  '/admin': { status: 404, type: /^text\/html/, robots: 'noindex', canonical: null },
  '/assets/nonexistent-file.js': { status: 404, type: /^(?!text\/html)/ },
  '/favicon.ico': { status: 404, type: /^(?!text\/html)/ },
  '/wp-login.php': { status: 404, type: /^(?!text\/html)/ },
  '/robots.txt': { status: 200, type: /^text\/plain/ },
  '/sitemap.xml': { status: 200, type: /^application\/xml/ },
  '/og-image.png': { status: 200, type: /^image\/png/ },
  '/api/config': { status: 200, type: /^application\/json/ },
  '/api/does-not-exist': { status: 404, type: /^application\/json/ },
  // No Access assertion reaches the local Worker, so Boss refuses outright.
  '/boss': { status: 403, type: /^application\/json/ },
  '/api/boss/content': { status: 403, type: /^application\/json/ },
};

const headOf = (html: string) => html.slice(0, html.indexOf('</head>'));
const all = (html: string, pattern: RegExp) => [...headOf(html).matchAll(pattern)].map((match) => match[1]);

test('every kind of path has its HTTP status, content type and indexing directives', async ({ request }) => {
  for (const [path, expected] of Object.entries(ROUTES)) {
    const response = await request.get(`${ORIGIN}${path}`, { maxRedirects: 0 });
    expect(response.status(), path).toBe(expected.status);
    expect(response.headers()['content-type'] ?? '', path).toMatch(expected.type);
    expect(response.headers()['x-content-type-options'], path).toBe('nosniff');
    if (expected.robots === undefined) continue;
    const html = await response.text();
    expect(all(html, /<meta name="robots" content="([^"]*)"/g), path).toEqual([expected.robots]);
    expect(all(html, /<link rel="canonical" href="([^"]*)"/g), path).toEqual(expected.canonical ? [expected.canonical] : []);
    if (expected.status === 404) {
      expect(headOf(html), path).not.toMatch(/property="og:|name="twitter:/);
      expect(response.headers()['content-security-policy'], path).toContain("default-src 'self'");
      expect(response.headers()['x-frame-options'], path).toBe('DENY');
    }
  }
});

test('a trailing slash on a public document redirects to its canonical address', async ({ request }) => {
  const response = await request.get(`${ORIGIN}/contact/?ref=qr`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe(`${ORIGIN}/contact?ref=qr`);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the 404 document is a complete, visible page', async ({ page }) => {
    const response = await page.goto(`${ORIGIN}/nonexistent-path`);
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle('404 — Page Not Found | Hakan Dundar');
    await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
    await expect(page.getByText('cd /nonexistent-path')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('link', { name: /Back home/ })).toHaveAttribute('href', '/');
  });
});

const captureFirstPaint = async (page: Page) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __paintedH1?: Element };
    new MutationObserver((_, observer) => {
      const h1 = document.querySelector('#root h1');
      if (!h1) return;
      w.__paintedH1 = h1;
      observer.disconnect();
    }).observe(document, { childList: true, subtree: true });
  });
};

test('the 404 document hydrates in place and the site stays navigable from it', async ({ page }) => {
  await page.route('**/api/analytics/**', (route) => route.abort());
  // The document itself is the only response allowed to fail (the browser logs
  // its 404 to the console); no script, style or API request may.
  const failed: string[] = [];
  page.on('response', (response) => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(String(error)));
  page.on('console', (message) => { if (/hydrat|did not match/i.test(message.text())) problems.push(message.text()); });
  await captureFirstPaint(page);

  const response = await page.goto(`${ORIGIN}/nonexistent-path`, { waitUntil: 'networkidle' });
  expect(response?.status()).toBe(404);
  expect(await page.evaluate(() => {
    const w = window as unknown as { __paintedH1?: Element };
    return w.__paintedH1 === document.querySelector('#root h1') && !!w.__paintedH1?.isConnected;
  })).toBe(true);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');

  await page.getByRole('link', { name: /Back home/ }).click();
  await expect(page).toHaveURL(`${ORIGIN}/`);
  await expect(page.locator('#services')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(`${ORIGIN}/nonexistent-path`);
  await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
  expect(failed).toEqual([`404 ${ORIGIN}/nonexistent-path`]);
  expect(problems).toEqual([]);
});
