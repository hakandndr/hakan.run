import { test, expect, Page } from '@playwright/test';

// The Boss shell against stubbed APIs.
//
// These run against the locally previewed build, where there is no Worker and
// no Cloudflare Access, so every Boss endpoint is stubbed. That is the point:
// the routing, the navigation state and the failure handling are frontend
// behaviour and are tested as frontend behaviour. Access remains the security
// boundary in the deployed environment and is not simulated here.

const json = (body: unknown, status = 200) => ({
  status,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify(body),
});

const DASHBOARD = {
  environment: 'staging',
  pendingSubmissions: 2,
  auditEvents: 7,
  oldestAnalyticsEvent: 1756900000000,
};

const SYSTEM = {
  environment: 'staging',
  analytics: {
    policyMaximumDays: 90,
    automaticPurge: false,
    oldestEventAt: 1756900000000,
    oldestEventDay: '2026-09-03',
    oldestEventAgeDays: 1,
    retentionOverdue: false,
    retainedEvents: 12,
  },
  bindings: { appDb: true, analyticsDb: true, turnstile: true, notifications: false, access: true },
};

const SUMMARY = {
  timeZone: 'America/Los_Angeles',
  range: { from: '2026-08-06', to: '2026-09-04', today: '2026-09-04' },
  coverage: { aggregateDays: ['2026-09-03'], rawDays: ['2026-09-04'], aggregateUsed: true, aggregateSuppressedByFilter: false },
  totals: { events: 12, human: 9, automated: 3, today: 4, uniqueAddresses: 6 },
  topPages: [{ label: '/', count: 8 }, { label: '/contact', count: 4 }],
  countries: [{ label: 'US', count: 10 }],
  trend: [],
};

const stubBossApi = async (page: Page, overrides: Record<string, unknown> = {}) => {
  await page.route('**/api/boss/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (overrides[path]) return route.fulfill(overrides[path] as never);
    if (path === '/api/boss/dashboard') return route.fulfill(json(DASHBOARD));
    if (path === '/api/boss/system') return route.fulfill(json(SYSTEM));
    if (path === '/api/boss/analytics/summary') return route.fulfill(json(SUMMARY));
    if (path === '/api/boss/content') return route.fulfill(json({ sections: [] }));
    if (path === '/api/boss/submissions') return route.fulfill(json({ submissions: [], pagination: { page: 1, limit: 25 } }));
    if (path === '/api/boss/audit') return route.fulfill(json({ events: [], pagination: { page: 1, limit: 25 } }));
    return route.fulfill(json({ error: 'not_found' }, 404));
  });
};

test.describe('Boss shell', () => {
  test('/boss lands on the Dashboard and reads its own API', async ({ page }) => {
    await stubBossApi(page);
    await page.goto('/boss');

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Pending submissions')).toBeVisible();
    await expect(page.getByText('2', { exact: true })).toBeVisible();
  });

  test('all six canonical sections are present, and no others', async ({ page }) => {
    await stubBossApi(page);
    await page.goto('/boss');

    const items = page.locator('[data-boss-nav]');
    await expect(items).toHaveCount(6);
    await expect(items).toHaveText([
      /Dashboard/, /Analytics/, /Content/, /Submissions/, /Audit/, /System/,
    ]);
  });

  test('navigation moves between sections and marks the active one', async ({ page }) => {
    await stubBossApi(page);
    await page.goto('/boss');

    await page.locator('[data-boss-nav="analytics"]').click();
    await expect(page).toHaveURL(/\/boss\/analytics$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Analytics' })).toBeVisible();
    await expect(page.locator('[data-boss-nav="analytics"]')).toHaveClass(/bg-accent-purple\/10/);
    await expect(page.locator('[data-boss-nav="dashboard"]')).not.toHaveClass(/bg-accent-purple\/10/);

    await page.locator('[data-boss-nav="system"]').click();
    await expect(page).toHaveURL(/\/boss\/system$/);
    // getByText is a case-insensitive substring match by default, and the
    // System section's own subtitle reads 'Bindings, retention policy and
    // environment'. Both elements are correct; the label is matched exactly so
    // it means the field and not the description of the field, and its value is
    // asserted beside it, which is what actually proves the panel read its API.
    const retentionLabel = page.getByText('Retention policy', { exact: true });
    await expect(retentionLabel).toHaveCount(1);
    await expect(retentionLabel).toBeVisible();
    await expect(page.getByText('90 days', { exact: true })).toBeVisible();
  });

  test('each section can be opened directly by URL', async ({ page }) => {
    await stubBossApi(page);
    for (const [path, heading] of [
      ['/boss/analytics', 'Analytics'],
      ['/boss/content', 'Content'],
      ['/boss/submissions', 'Submissions'],
      ['/boss/audit', 'Audit'],
      ['/boss/system', 'System'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
  });

  test('an unknown Boss path returns to the Dashboard rather than the public 404', async ({ page }) => {
    await stubBossApi(page);
    await page.goto('/boss/nope');
    await expect(page).toHaveURL(/\/boss$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  });

  test('the public header and footer are absent inside Boss', async ({ page }) => {
    await stubBossApi(page);
    await page.goto('/boss');
    await expect(page.getByRole('link', { name: /Let's Run/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Portfolio' })).toHaveCount(0);
  });

  test('an empty module says it is empty rather than showing nothing', async ({ page }) => {
    await stubBossApi(page);
    await page.goto('/boss/submissions');
    await expect(page.locator('[data-boss-state="empty"]')).toBeVisible();
  });

  test('an HTML answer is an error, not empty data', async ({ page }) => {
    // The failure this project actually had: a Boss path answered by the
    // single-page-application fallback instead of the Worker.
    await stubBossApi(page, {
      '/api/boss/dashboard': { status: 200, contentType: 'text/html', body: '<!doctype html><html><body>shell</body></html>' },
    });
    await page.goto('/boss');

    const error = page.locator('[data-boss-state="error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('did not reach the Worker');
    await expect(page.locator('[data-boss-state="empty"]')).toHaveCount(0);
  });

  test('a Worker refusal shows its reason and offers a retry', async ({ page }) => {
    await stubBossApi(page, {
      '/api/boss/system': json({ error: 'forbidden', reason: 'not_owner' }, 403),
    });
    await page.goto('/boss/system');

    const error = page.locator('[data-boss-state="error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('not_owner');
    await expect(error.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test('the Boss surface is never indexable', async ({ page }) => {
    await stubBossApi(page);
    await page.goto('/boss');

    // Exactly one tag, not one correct tag beside an indexable one. A crawler
    // reading two robots directives is entitled to obey either.
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveCount(1);
    await expect(robots).toHaveAttribute('content', 'noindex, nofollow');
  });

  test('the shell is usable at a narrow viewport', async ({ page }) => {
    await stubBossApi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/boss');
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(page.locator('[data-boss-nav="system"]')).toBeVisible();
  });
});
