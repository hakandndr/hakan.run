import { test, expect, type Page } from '@playwright/test';

// Security policy acceptance against the real Worker over the built assets
// (tests/support/document-server.mjs, which applies the generated _headers to
// asset responses as Cloudflare Static Assets does). Report-only and enforced
// policies both fire securitypolicyviolation events, so the gate is identical
// in either CSP mode: no application-owned violation, console error or failed
// first-party request.
const ORIGIN = process.env.SECURITY_ORIGIN ?? 'http://localhost:4175';
const PAGES = [
  '/',
  '/contact',
  '/card',
  '/notes',
  '/notes/a-write-path-for-a-mostly-static-site',
  '/notes/why-the-status-page-ignores-single-failed-probes',
];

type Violation = { directive: string; blocked: string; source: string };

const watch = async (page: Page) => {
  const violations: Violation[] = [];
  const errors: string[] = [];
  const failed: string[] = [];
  await page.exposeFunction('__recordViolation', (violation: Violation) => { violations.push(violation); });
  await page.addInitScript(() => {
    window.sessionStorage.setItem('hakan.run:boot-intro-seen', '1');
    document.addEventListener('securitypolicyviolation', (event) => {
      (window as unknown as { __recordViolation: (v: unknown) => void }).__recordViolation({
        directive: event.effectiveDirective, blocked: event.blockedURI, source: event.sourceFile,
      });
    });
  });
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith(ORIGIN) && response.status() >= 400 && !response.url().includes('not-a-real-note')) failed.push(`${response.status()} ${response.url()}`);
  });
  await page.route('**/api/analytics/page', (route) => route.fulfill({ status: 202, contentType: 'application/json', body: '{"status":"recorded"}' }));
  return { violations, errors, failed };
};

test('public pages and route transitions produce no CSP violations', async ({ page }) => {
  const seen = await watch(page);
  for (const path of PAGES) {
    await page.goto(`${ORIGIN}${path}`, { waitUntil: 'load' });
    await page.waitForTimeout(600);
  }
  await page.goto(`${ORIGIN}/`, { waitUntil: 'load' });
  await page.locator('#notes a[href="/notes"]').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();
  await page.getByRole('link', { name: /Reachable is not current/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Reachable is not current' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Engineering Notes' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'Reachable is not current' })).toBeVisible();
  await page.waitForTimeout(400);
  expect(seen.violations).toEqual([]);
  expect(seen.errors).toEqual([]);
  expect(seen.failed).toEqual([]);
});

test('asset-first and Worker-rendered documents carry the same security policy', async ({ request }) => {
  const policy = (headers: Record<string, string>) => ({
    hsts: headers['strict-transport-security'] ?? null,
    nosniff: headers['x-content-type-options'],
    referrer: headers['referrer-policy'],
    permissions: headers['permissions-policy'],
    frame: headers['x-frame-options'],
    csp: headers['content-security-policy'],
    cspReportOnly: headers['content-security-policy-report-only'] ?? null,
  });
  const worker = policy((await request.get(`${ORIGIN}/notes`)).headers());
  const asset = policy((await request.get(`${ORIGIN}/robots.txt`)).headers());
  const notFound = policy((await request.get(`${ORIGIN}/notes/not-a-real-note`)).headers());
  expect(worker.nosniff).toBe('nosniff');
  expect(worker.frame).toBe('DENY');
  expect(worker.csp).toContain("frame-ancestors 'none'");
  // The local server is plain HTTP and routes every request through the Worker,
  // which withholds HSTS over HTTP. HSTS on asset-first responses is proven on
  // the deployed HTTPS environment (tools/verify-security-headers.js).
  expect(asset).toEqual(worker);
  expect(notFound).toEqual(worker);
  expect(worker.hsts).toBeNull();
  const api = (await request.get(`${ORIGIN}/api/config`)).headers();
  expect(api['x-content-type-options']).toBe('nosniff');
  expect(api['content-security-policy']).toBeUndefined();
  expect(api['x-frame-options']).toBeUndefined();
});
