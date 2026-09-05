import { test, expect, Page } from '@playwright/test';

// The contact form against the Worker contract, with the Worker stubbed.
//
// Turnstile itself is not exercised: its script is third-party and the preview
// server is offline to it. What is exercised is everything this project owns —
// where the form posts, what shape it posts, what each answer means, and what
// the page does when the challenge cannot load at all.

const json = (body: unknown, status = 200) => ({
  status,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify(body),
});

const stubConfig = (page: Page, siteKey: string | null) =>
  page.route('**/api/config', (route) =>
    route.fulfill(json({ contract: 1, environment: 'test', turnstileSiteKey: siteKey })),
  );

const TEST_TOKEN = 'turnstile-test-token';

// A stand-in for the Turnstile script.
//
// Blocking the real script does not test the form, it tests the refusal path:
// the Worker rejects a submission with no token, so the page correctly declines
// to send one and the form never reaches success. That refusal is worth testing
// and is tested below — but it is not the same test as "a submission works".
//
// So the script is served rather than blocked. It defines the same surface the
// hook uses: render() takes the callback and hands back a token, reset() clears
// it. The token is fake because the verification is the Worker's job and the
// Worker is stubbed here; everything on this side of the boundary is real.
const stubTurnstileScript = (page: Page) =>
  page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `window.turnstile = {
        render: (element, options) => {
          element.setAttribute('data-turnstile-rendered', 'true');
          setTimeout(() => options.callback(${JSON.stringify(TEST_TOKEN)}), 0);
          return 'test-widget';
        },
        reset: () => {},
      };`,
    }),
  );

const fillForm = async (page: Page) => {
  await page.fill('input[name="name"]', 'Hakan Dundar');
  await page.fill('input[name="email"]', 'hakan@dndr.net');
  await page.fill('textarea[name="message"]', 'Testing the Worker submission path.');
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('booted', '1'));
});

test.describe('contact form', () => {
  test('submits to the Worker endpoint, not to any third party', async ({ page }) => {
    await stubConfig(page, 'test-site-key');
    await stubTurnstileScript(page);
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') requests.push(request.url());
    });

    let body: unknown;
    await page.route('**/api/contact', async (route) => {
      body = JSON.parse(route.request().postData() ?? '{}');
      await route.fulfill(json({ id: 'sub-1', status: 'stored' }, 202));
    });

    await page.goto('/contact');
    await fillForm(page);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('button[type="submit"]')).toContainText('message sent');
    expect(requests.every((url) => new URL(url).pathname === '/api/contact')).toBe(true);
    expect(requests.some((url) => url.includes('formspree'))).toBe(false);
    expect(body).toMatchObject({
      name: 'Hakan Dundar',
      email: 'hakan@dndr.net',
      message: 'Testing the Worker submission path.',
      sourcePath: '/contact',
      // The solved challenge travels with the submission. Without this the
      // Worker would refuse it, and asserting only that a request happened
      // would not notice.
      turnstileToken: TEST_TOKEN,
    });
  });

  test('a 202 clears the form, because the submission is durably stored', async ({ page }) => {
    await stubConfig(page, 'test-site-key');
    await stubTurnstileScript(page);
    await page.route('**/api/contact', (route) => route.fulfill(json({ id: 'sub-2', status: 'stored' }, 202)));

    await page.goto('/contact');
    await fillForm(page);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('button[type="submit"]')).toContainText('message sent');
    await expect(page.locator('input[name="name"]')).toHaveValue('');
  });

  test('a refused submission keeps the visitor informed and keeps their text', async ({ page }) => {
    await stubConfig(page, 'test-site-key');
    await stubTurnstileScript(page);
    let posted = false;
    await page.route('**/api/contact', (route) => {
      posted = true;
      return route.fulfill(json({ error: 'challenge_failed' }, 403));
    });

    await page.goto('/contact');
    await fillForm(page);
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText('Message failed. Please try again.')).toBeVisible();
    // The submission must actually have been attempted, or this would pass for
    // the wrong reason — a page that never sends anything also never succeeds.
    expect(posted).toBe(true);
    // Losing what someone typed because the server said no is its own failure.
    await expect(page.locator('input[name="name"]')).toHaveValue('Hakan Dundar');
  });

  test('a challenge script that will not load is refused before anything is sent', async ({ page }) => {
    // The other half of the pair: the Worker fails closed without a token, so
    // sending would be a certain 403. Refusing locally is the same outcome
    // without a visitor believing their message went.
    await stubConfig(page, 'test-site-key');
    await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
    let posted = false;
    await page.route('**/api/contact', (route) => { posted = true; return route.fulfill(json({}, 500)); });

    await page.goto('/contact');
    await expect(page.locator('[data-contact-challenge="unavailable"]')).toBeAttached();

    await fillForm(page);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Message failed. Please try again.')).toBeVisible();
    expect(posted).toBe(false);
  });

  test('an unavailable challenge is reported instead of being sent to certain refusal', async ({ page }) => {
    await stubConfig(page, null);
    let posted = false;
    await page.route('**/api/contact', (route) => { posted = true; return route.fulfill(json({}, 500)); });

    await page.goto('/contact');
    await expect(page.locator('[data-contact-challenge="unavailable"]')).toBeAttached();
    await expect(page.getByRole('alert')).toContainText('Verification is unavailable');

    await fillForm(page);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Message failed. Please try again.')).toBeVisible();
    expect(posted).toBe(false);
  });
});

test.describe('project routes', () => {
  // The canonical record for this slug is titled 'Full-Stack SaaS Platform'
  // (apps/web/src/pages/Project.jsx), and the page renders `${title} — Hakan
  // Dundar`. The slug and the title are different strings and always were.
  test('a known legacy slug still renders its project', async ({ page }) => {
    await page.goto('/project/full-stack-development');
    await expect(page).toHaveTitle('Full-Stack SaaS Platform — Hakan Dundar');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Full-Stack SaaS Platform');
  });

  test('an external portfolio slug does not silently render a different project', async ({ page }) => {
    // Production portfolio cards are external links and never route here. If one
    // is opened directly it must not answer with the first legacy record.
    for (const slug of ['dndr-labs', 'turkcyber', 'turkiyecennet', 'americawhat']) {
      await page.goto(`/project/${slug}`);
      await expect(page.getByText('404')).toBeVisible();
      await expect(page).not.toHaveTitle(/Full-Stack SaaS Platform/i);
    }
  });
});
