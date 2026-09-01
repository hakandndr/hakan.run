import { expect, Page, test } from '@playwright/test';

const DESKTOP = { width: 1440, height: 1200 };
const MOBILE = { width: 390, height: 844 };

test.beforeEach(async ({ }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium',
    'The visual matrix uses explicit viewports in one Chromium project.');
});

async function prepare(page: Page, path: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    window.sessionStorage.setItem('booted', '1');
    window.localStorage.clear();
  });
  await page.route(/^https?:\/\/(?!localhost:3000)/, route => route.abort());
  await page.goto(path, { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0.001ms !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
      }
    `,
  });

  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.75) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(100);
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
}

test('desktop public visual baseline', async ({ page }) => {
  await prepare(page, '/', DESKTOP);
  await expectNoHorizontalOverflow(page);
  await expect(page.locator('header nav')).toBeVisible();
  await expect(page).toHaveScreenshot('home-full-desktop.png', { fullPage: true, animations: 'disabled' });
  await expect(page.locator('main section').first()).toHaveScreenshot('home-hero-desktop.png', { animations: 'disabled' });
  await expect(page.locator('#services')).toHaveScreenshot('home-expertise-desktop.png', { animations: 'disabled' });
  await expect(page.locator('#portfolio')).toHaveScreenshot('home-portfolio-desktop.png', { animations: 'disabled' });
  await expect(page.locator('#about')).toHaveScreenshot('home-about-desktop.png', { animations: 'disabled' });
  await expect(page.locator('#cta')).toHaveScreenshot('home-cta-desktop.png', { animations: 'disabled' });
  await expect(page.locator('footer')).toHaveScreenshot('home-footer-desktop.png', { animations: 'disabled' });

  await prepare(page, '/contact', DESKTOP);
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('contact-desktop.png', { fullPage: true, animations: 'disabled' });

  await prepare(page, '/project/full-stack-development', DESKTOP);
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('project-desktop.png', { fullPage: true, animations: 'disabled' });

  await prepare(page, '/visual-baseline-not-found', DESKTOP);
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('not-found-desktop.png', { fullPage: true, animations: 'disabled' });
});

test('mobile public visual baseline and menu states', async ({ page }) => {
  await prepare(page, '/', MOBILE);
  await expectNoHorizontalOverflow(page);
  await expect(page.locator('header nav')).toBeHidden();
  await expect(page).toHaveScreenshot('mobile-navigation-closed.png', { animations: 'disabled' });
  await expect(page).toHaveScreenshot('home-full-mobile.png', { fullPage: true, animations: 'disabled' });
  await expect(page.locator('main section').first()).toHaveScreenshot('home-hero-mobile.png', { animations: 'disabled' });
  await expect(page.locator('#services')).toHaveScreenshot('home-expertise-mobile.png', { animations: 'disabled' });
  await expect(page.locator('#portfolio')).toHaveScreenshot('home-portfolio-mobile.png', { animations: 'disabled' });

  await page.locator('header button').filter({ hasText: '[=]' }).click();
  const menuClose = page.locator('.fixed.inset-0').getByRole('button', { name: '[x]' });
  await expect(menuClose).toBeVisible();
  await expect(page).toHaveScreenshot('mobile-navigation-open.png', { animations: 'disabled' });
  await menuClose.click();

  await prepare(page, '/contact', MOBILE);
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('contact-mobile.png', { fullPage: true, animations: 'disabled' });

  await prepare(page, '/project/full-stack-development', MOBILE);
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('project-mobile.png', { fullPage: true, animations: 'disabled' });

  await prepare(page, '/visual-baseline-not-found', MOBILE);
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('not-found-mobile.png', { fullPage: true, animations: 'disabled' });
});

test('responsive transition evidence and expertise interaction', async ({ page }) => {
  for (const viewport of [
    { width: 1024, height: 900 },
    { width: 768, height: 900 },
  ]) {
    await prepare(page, '/', viewport);
    await expectNoHorizontalOverflow(page);
    await expect(page.locator('header nav')).toBeVisible();
    await expect(page).toHaveScreenshot(`home-${viewport.width}px.png`, { animations: 'disabled' });

    const heroPhoto = page.locator('main section').first().locator('img');
    if (viewport.width === 1024) {
      await expect(heroPhoto).toBeVisible();
    } else {
      await expect(heroPhoto).toBeHidden();
    }
  }

  await prepare(page, '/', MOBILE);
  await expect(page.locator('main section').first().locator('img')).toBeHidden();
  const firstTrigger = page.locator('#services .cursor-pointer').first();
  await expect(firstTrigger).toContainText('RUNNING');
  await firstTrigger.click();
  await expect(firstTrigger).toContainText('IDLE');
  await firstTrigger.click();
  await expect(firstTrigger).toContainText('RUNNING');
});
