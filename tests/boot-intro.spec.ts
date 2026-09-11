import { expect, test } from '@playwright/test';
import {
  isolatePublicWrites,
  publishedContentResponse,
  waitForPublishedSite,
} from './helpers/published-content';

test.beforeEach(async ({ page }) => {
  await isolatePublicWrites(page);
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
