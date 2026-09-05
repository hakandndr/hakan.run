import { test, expect, Page } from '@playwright/test';

// The public content authority, from the browser's side.
//
// APP_DB is the authority and /api/content is the only runtime path to it. The
// preview server used by these tests has no Worker, so the endpoint is stubbed;
// what is being tested is what the frontend does with each possible answer, and
// that is frontend behaviour either way.
//
// The distinction these tests exist to defend: the fallback is shown in three
// of the four cases, but only one of them is content. A test that only checked
// what is on screen would pass for all three and would not notice the site
// silently running on built-in copy because its authority was unreachable.

const FALLBACK_HEADING = 'BUILD. DEPLOY.';
const PUBLISHED_HEADING = 'PUBLISHED FROM APP_DB.';

const heroSection = (headingLine1: string) => ({
  id: 'hero',
  revision: 3,
  publishedAt: 1757000000000,
  data: {
    badge: 'Software Developer • QA Automation • Irvine, CA',
    headingLine1,
    headingLine2: 'RUN.',
    paragraphs: ['Published copy.'],
    primaryButton: 'View Projects',
    primaryButtonHref: '#portfolio',
    secondaryButton: "Let's Connect",
    secondaryButtonHref: '/contact',
  },
});

const stubContent = (page: Page, fulfil: Record<string, unknown>) =>
  page.route('**/api/content', (route) => route.fulfill(fulfil as never));

const json = (body: unknown, status = 200) => ({
  status,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify(body),
});

const consoleErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('booted', '1'));
});

test.describe('public content source', () => {
  test('published content is what the page renders', async ({ page }) => {
    await stubContent(page, json({
      contract: 1,
      count: 1,
      publishedAt: 1757000000000,
      sections: [heroSection(PUBLISHED_HEADING)],
    }));
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(PUBLISHED_HEADING);
  });

  test('an unpublished site renders the fallback and reports no error', async ({ page }) => {
    const errors = consoleErrors(page);
    await stubContent(page, json({ contract: 1, count: 0, publishedAt: null, sections: [] }));
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(FALLBACK_HEADING);
    expect(errors.filter((line) => line.includes('/api/content'))).toEqual([]);
  });

  test('a server failure renders the fallback AND reports the failure', async ({ page }) => {
    // Both halves matter. The visitor sees a working site; the operator sees
    // that the authority is unreachable. Only reporting one of those is the bug.
    const errors = consoleErrors(page);
    await stubContent(page, json({ error: 'content_unavailable' }, 503));
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(FALLBACK_HEADING);
    await expect
      .poll(() => errors.filter((line) => line.includes('http_503')).length)
      .toBeGreaterThan(0);
  });

  test('an HTML answer is reported as a contract failure, not as an empty site', async ({ page }) => {
    // The failure this project has already had: the asset layer answering an
    // API path with the single-page-application shell, HTTP 200.
    const errors = consoleErrors(page);
    await stubContent(page, {
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html><body>shell</body></html>',
    });
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(FALLBACK_HEADING);
    await expect
      .poll(() => errors.filter((line) => line.includes('not_json')).length)
      .toBeGreaterThan(0);
  });

  test('a malformed section is never partially applied', async ({ page }) => {
    const errors = consoleErrors(page);
    await stubContent(page, json({
      contract: 1,
      count: 2,
      publishedAt: 1,
      sections: [heroSection(PUBLISHED_HEADING), { id: 'footer', data: 'not an object' }],
    }));
    await page.goto('/');

    // The good section in the same response is not applied either: a response
    // that failed its contract is not a source of partial truth.
    await expect(page.getByRole('heading', { level: 1 })).toContainText(FALLBACK_HEADING);
    await expect.poll(() => errors.filter((line) => line.includes('malformed')).length).toBeGreaterThan(0);
  });

  test('the API overrides the legacy localStorage overlay', async ({ page }) => {
    // Precedence is fallback, then the legacy Admin localStorage blob, then the
    // API. Pinned here so removing the legacy surface is a decision rather than
    // something discovered when a stale browser blob outranks published content.
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'siteContent',
        JSON.stringify({ hero: { headingLine1: 'STALE LOCAL COPY.', headingLine2: 'RUN.' } }),
      );
    });
    await stubContent(page, json({
      contract: 1,
      count: 1,
      publishedAt: 1,
      sections: [heroSection(PUBLISHED_HEADING)],
    }));
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(PUBLISHED_HEADING);
  });

  test('the legacy localStorage overlay still wins over the built-in fallback when nothing is published', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'siteContent',
        JSON.stringify({ hero: { headingLine1: 'STALE LOCAL COPY.', headingLine2: 'RUN.' } }),
      );
    });
    await stubContent(page, json({ contract: 1, count: 0, publishedAt: null, sections: [] }));
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('STALE LOCAL COPY.');
  });
});
