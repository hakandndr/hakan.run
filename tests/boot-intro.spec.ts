import { expect, test } from '@playwright/test';
import {
  isolatePublicWrites,
  publishedContentResponse,
  waitForPublishedSite,
} from './helpers/published-content';

test.beforeEach(async ({ page }) => {
  await isolatePublicWrites(page);
});

test('built document paints only a uniform canvas before React executes', async ({ page, request }) => {
  const response = await request.get('/');
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).not.toContain('bootstrap-shell');
  expect(html).not.toContain('data-public-bootstrap="loading"');
  expect(html).not.toMatch(/skeleton|placeholder/i);

  await page.route('**/*.js', route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#root')).toBeEmpty();
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(9, 9, 9)');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(9, 9, 9)');
  await expect(page.locator('#root')).toHaveCSS('background-color', 'rgb(9, 9, 9)');

  const pseudoPaint = await page.evaluate(() =>
    ['html', 'body', '#root'].flatMap(selector => {
      const element = document.querySelector(selector);
      return ['::before', '::after'].map(pseudo => {
        const style = window.getComputedStyle(element, pseudo);
        return {
          selector: `${selector}${pseudo}`,
          content: style.content,
          backgroundImage: style.backgroundImage,
        };
      });
    }),
  );
  expect(pseudoPaint).toEqual(pseudoPaint.map(paint => ({
    ...paint,
    content: 'none',
    backgroundImage: 'none',
  })));
});

test('BootIntro is a presentation-only fresh-load overlay with no editable copy', async ({ page }) => {
  let releaseContent: (() => void) | undefined;
  const contentGate = new Promise<void>(resolve => { releaseContent = resolve; });
  await page.route('**/api/content', async route => {
    await contentGate;
    await route.fulfill(publishedContentResponse);
  });

  await page.goto('/', { waitUntil: 'load' });
  const intro = page.locator('[data-boot-intro="presentation"]');
  await expect(intro).toBeVisible();
  await expect(intro).toHaveAttribute('aria-hidden', 'true');
  await expect(intro).toHaveCSS('position', 'fixed');
  await expect(intro).toHaveCSS('pointer-events', 'none');
  await expect(intro).toHaveCSS('background-color', 'rgb(9, 9, 9)');
  await expect(intro).toContainText('BIOS V2.0.26 — HAKAN.RUN');
  await expect(intro).toContainText('$ init hakan.run');
  await expect(intro).toContainText('> loading components... [OK]');
  await expect(intro).toContainText('> mounting services... [OK]');
  await expect(intro).toContainText('> boot sequence complete');
  await expect(page.locator('[data-public-bootstrap="loading"]')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('BUILD. DEPLOY. RUN.');
  await expect(page.locator('body')).not.toContainText('MY EXPERTISE');

  releaseContent?.();
  await waitForPublishedSite(page);
  await expect(page.locator('h1')).toContainText('BUILD. DEPLOY.');
  await expect(page.locator('h1')).toContainText('RUN.');
});

test('BootIntro background stays immutable when published theme tokens are applied', async ({ page }) => {
  const payload = JSON.parse(publishedContentResponse.body);
  const colors = payload.sections.find((section: { id: string }) => section.id === 'colors');
  colors.data.background = '#0c1424';

  let releaseContent: (() => void) | undefined;
  const contentGate = new Promise<void>(resolve => { releaseContent = resolve; });
  await page.route('**/api/content', async route => {
    await contentGate;
    await route.fulfill({
      ...publishedContentResponse,
      body: JSON.stringify(payload),
    });
  });

  await page.goto('/', { waitUntil: 'load' });
  const intro = page.locator('[data-boot-intro="presentation"]');
  await page.addStyleTag({ content: '.boot-intro { animation: none !important; opacity: 1 !important; }' });
  await expect(intro).toHaveCSS('background-color', 'rgb(9, 9, 9)');

  releaseContent?.();
  await waitForPublishedSite(page);
  await expect(page.locator('html')).toHaveCSS('--color-bg', '#0c1424');
  await expect(intro).toBeVisible();
  await expect(intro).toHaveCSS('background-color', 'rgb(9, 9, 9)');
});

test('seen intro leaves a blank stable loading canvas until READY', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('hakan.run:boot-intro-seen', '1');
  });

  let releaseContent: (() => void) | undefined;
  const contentGate = new Promise<void>(resolve => { releaseContent = resolve; });
  await page.route('**/api/content', async route => {
    await contentGate;
    await route.fulfill(publishedContentResponse);
  });

  await page.goto('/', { waitUntil: 'load' });
  await expect(page.locator('[data-boot-intro="presentation"]')).toHaveCount(0);

  const shell = page.locator('[data-public-bootstrap="loading"]');
  await expect(shell).toBeVisible();
  await expect(shell).toHaveCSS('background-color', 'rgb(9, 9, 9)');
  await expect(shell).toBeEmpty();

  releaseContent?.();
  await waitForPublishedSite(page);
  await expect(shell).toHaveCount(0);
  await expect(page.locator('h1')).toContainText('BUILD. DEPLOY.');
  await expect(page.locator('h1')).toContainText('RUN.');
});

test('BootIntro is claimed once per tab session and does not replay on reload or navigation', async ({ page }) => {
  await page.route('**/api/content', route => route.fulfill(publishedContentResponse));

  await page.goto('/');
  const intro = page.locator('[data-boot-intro="presentation"]');
  await expect(intro).toHaveCount(1);
  await expect.poll(() => page.evaluate(() =>
    window.sessionStorage.getItem('hakan.run:boot-intro-seen'),
  )).toBe('1');
  await expect(intro).toBeHidden();

  await page.locator('a[href="/contact"]').first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator('form')).toBeVisible();
  await expect(intro).toHaveCount(1);
  await expect(intro).toBeHidden();

  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('form')).toBeVisible();
  await expect(page.locator('[data-boot-intro="presentation"]')).toHaveCount(0);
});

test('footer canonical mark renders its slash in white', async ({ page }) => {
  await page.route('**/api/content', route => route.fulfill(publishedContentResponse));
  await page.goto('/');
  await waitForPublishedSite(page);

  const slash = page.locator('[data-footer-logo-slash]');
  await expect(slash).toHaveText('/');
  await expect(slash).toHaveCSS('color', 'rgb(255, 255, 255)');
});

test('reduced motion makes BootIntro effectively immediate without blocking READY', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/content', route => route.fulfill(publishedContentResponse));

  await page.goto('/');
  await waitForPublishedSite(page);

  await expect(page.locator('[data-boot-intro="presentation"]')).toBeHidden();
  await expect(page.getByText('MY EXPERTISE', { exact: true })).toBeVisible();
});

test('MY EXPERTISE keeps its single-open accordion behavior', async ({ page }) => {
  await page.route('**/api/content', route => route.fulfill(publishedContentResponse));
  await page.goto('/');
  await waitForPublishedSite(page);

  const services = page.locator('#services');
  await expect(services.getByText('RUNNING')).toHaveCount(1);
  await expect(services.getByText('IDLE')).toHaveCount(3);

  const secondService = services.locator('h3').nth(1);
  await secondService.click();
  await expect(services.getByText('RUNNING')).toHaveCount(1);
  await expect(services.getByText('IDLE')).toHaveCount(3);
  await expect(secondService).toHaveClass(/text-accent-purple/);
});
