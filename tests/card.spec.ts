import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  isolatePublicWrites,
  publishedContentResponse,
  waitForPublishedSite,
} from './helpers/published-content';

const cardResponse = (change?: (payload: any) => void) => {
  const payload = JSON.parse(publishedContentResponse.body);
  change?.(payload);
  return { ...publishedContentResponse, body: JSON.stringify(payload) };
};

const section = (payload: any, id: string) =>
  payload.sections.find((entry: { id: string }) => entry.id === id).data;

const serve = async (page: Page, change?: (payload: any) => void) => {
  await isolatePublicWrites(page);
  await page.route('**/api/content', route => route.fulfill(cardResponse(change)));
  await page.addInitScript(() => {
    window.sessionStorage.setItem('hakan.run:boot-intro-seen', '1');
  });
};

const waitForCard = (page: Page) => page.locator('[data-public-section="card"]').waitFor();

test('direct /card, refresh, and canonical metadata use the public route', async ({ page }) => {
  await serve(page);
  await page.goto('/card');
  await waitForCard(page);

  await expect(page).toHaveURL(/\/card$/);
  await expect(page).toHaveTitle('Published Name — Digital Business Card');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://hakan.run/card');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Digital business card for Published Name, Published Role.',
  );

  await page.reload();
  await waitForCard(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Published Name');
});

test('identity, real profile media, actions, and logo come only from validated canonical data', async ({ page }) => {
  await serve(page, payload => {
    const hero = section(payload, 'hero');
    hero.profile.name = 'Canonical Person';
    hero.profile.role = 'Canonical Role';
    hero.profile.location = 'Canonical Location';
    hero.profile.imageAlt = 'Canonical profile image';
    const contact = section(payload, 'contact');
    contact.infoBlocks = [{ title: 'Published email', lines: ['canonical@example.com'] }];
    contact.socialLinks = [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/in/canonical/' },
      { name: 'GitHub', url: 'https://github.com/canonical' },
    ];
  });
  await page.goto('/card');
  await waitForCard(page);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Canonical Person');
  await expect(page.getByText('Canonical Role', { exact: true })).toBeVisible();
  await expect(page.getByText('Canonical Location', { exact: true })).toBeVisible();
  const images = page.locator('[data-public-section="card"] img');
  await expect(images).toHaveCount(1);
  await expect(images).toHaveAttribute('src', '/media/HakanDundar.webp');
  await expect(images).toHaveAttribute('alt', 'Canonical profile image');

  const actions = page.locator('[data-card-action]');
  await expect(actions).toHaveCount(4);
  await expect(page.locator('[data-card-action="portfolio"]')).toHaveAttribute('href', '/#portfolio');
  await expect(page.locator('[data-card-action="linkedin"]')).toHaveAttribute('href', 'https://www.linkedin.com/in/canonical/');
  await expect(page.locator('[data-card-action="github"]')).toHaveAttribute('href', 'https://github.com/canonical');
  await expect(page.locator('[data-card-action="email"]')).toHaveAttribute('href', 'mailto:canonical@example.com');
  expect(await actions.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual([
    '/#portfolio',
    'https://www.linkedin.com/in/canonical/',
    'https://github.com/canonical',
    'mailto:canonical@example.com',
  ]);

  const slash = page.locator('[data-card-logo-slash]');
  await expect(slash).toHaveText('/');
  await expect(slash).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.locator('[data-card-brand-mark] > span').first()).toHaveCSS('color', 'rgb(87, 184, 255)');
  await expect(page.locator('[data-card-brand-mark] > span').last()).toHaveCSS('color', 'rgb(87, 184, 255)');
});

test('missing optional public destinations are omitted instead of replaced', async ({ page }) => {
  await serve(page, payload => {
    const contact = section(payload, 'contact');
    contact.infoBlocks = [];
    contact.socialLinks = [];
    section(payload, 'header').navLinks = section(payload, 'header').navLinks
      .filter((link: { name: string }) => link.name !== 'Portfolio');
  });
  await page.goto('/card');
  await waitForCard(page);

  await expect(page.locator('[data-card-action]')).toHaveCount(0);
  await expect(page.getByText('00 links')).toBeVisible();
  await expect(page.locator('a[href*="linkedin"], a[href*="github"], a[href^="mailto:"]')).toHaveCount(0);
});

test('Add to Contacts exposes a valid standards-compatible vCard using approved values', async ({ page }) => {
  await serve(page, payload => {
    const hero = section(payload, 'hero');
    hero.profile.name = 'Approved Name';
    hero.profile.role = 'Approved Role';
    hero.headingLine1 = 'APPROVED.';
    hero.headingLine2 = 'SLOGAN.';
    const contact = section(payload, 'contact');
    contact.infoBlocks = [{ title: 'Email', lines: ['approved@example.com'] }];
    contact.socialLinks = [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/in/approved/' },
      { name: 'GitHub', url: 'https://github.com/approved' },
    ];
  });
  await page.goto('/card');
  await waitForCard(page);

  const link = page.locator('[data-card-add-contact]');
  await expect(link).toHaveAttribute('download', 'approved-name.vcf');
  await expect(link).toHaveAttribute('type', 'text/vcard;charset=utf-8');
  await expect(link).toHaveAttribute('aria-label', 'Add Approved Name to contacts by downloading a vCard');
  const href = await link.getAttribute('href');
  expect(href).toMatch(/^data:text\/vcard;charset=utf-8,/);
  const vCard = decodeURIComponent(href!.slice(href!.indexOf(',') + 1));
  expect(vCard).toBe([
    'BEGIN:VCARD',
    'VERSION:4.0',
    'KIND:individual',
    'FN:Approved Name',
    'TITLE:Approved Role',
    'EMAIL;TYPE=work:approved@example.com',
    'URL;TYPE=work:https://hakan.run/',
    'X-SOCIALPROFILE;TYPE=linkedin:https://www.linkedin.com/in/approved/',
    'X-SOCIALPROFILE;TYPE=github:https://github.com/approved',
    'NOTE:APPROVED. SLOGAN.',
    'END:VCARD',
    '',
  ].join('\r\n'));
});

for (const width of [360, 390, 430]) {
  test(`mobile layout is usable without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await serve(page);
    await page.goto('/card');
    await waitForCard(page);

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.locator('[data-card-profile-image]')).toBeVisible();
    for (const box of await page.locator('[data-card-action], [data-card-add-contact]').evaluateAll(nodes =>
      nodes.map(node => node.getBoundingClientRect().toJSON()),
    )) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
}

test('desktop layout has an intentional maximum width and two balanced regions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await serve(page);
  await page.goto('/card');
  await waitForCard(page);

  const surface = page.locator('[data-public-section="card"] > div').nth(2).locator('> div');
  const bounds = await surface.boundingBox();
  expect(bounds?.width).toBeLessThanOrEqual(1024);
  expect(bounds?.width).toBeGreaterThan(850);
  const regions = await surface.locator('section').evaluateAll(nodes =>
    nodes.map(node => node.getBoundingClientRect().width),
  );
  expect(regions).toHaveLength(2);
  expect(regions.every(width => width > 350)).toBe(true);
});

test('interactive controls are keyboard reachable with visible focus', async ({ page }) => {
  await serve(page);
  await page.goto('/card');
  await waitForCard(page);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Return to hakan.run' })).toBeFocused();
  await page.keyboard.press('Tab');
  const addContact = page.locator('[data-card-add-contact]');
  await expect(addContact).toBeFocused();
  expect(await addContact.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe('none');
});

test('Back and Forward preserve /, /card, and /contact entries', async ({ page }) => {
  await serve(page);
  await page.route('**/api/config', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ contract: 1, environment: 'test', turnstileSiteKey: null }),
  }));

  await page.goto('/');
  await waitForPublishedSite(page);
  await page.goto('/card');
  await waitForCard(page);
  await page.goto('/contact');
  await expect(page.locator('form')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/card$/);
  await waitForCard(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await waitForPublishedSite(page);
  await page.goForward();
  await expect(page).toHaveURL(/\/card$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/contact$/);
});

test('internal /card transitions retain one BootIntro claim and central navigation/scroll ownership', async ({ page }) => {
  await isolatePublicWrites(page);
  await page.route('**/api/content', route => route.fulfill(publishedContentResponse));
  await page.goto('/');
  await waitForPublishedSite(page);
  await expect.poll(() => page.evaluate(() =>
    window.sessionStorage.getItem('hakan.run:boot-intro-seen'),
  )).toBe('1');

  await page.evaluate(() => {
    window.history.pushState({}, '', '/card');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await waitForCard(page);
  await expect(page.locator('[data-boot-intro="presentation"]')).toBeHidden();
  await page.locator('[data-card-action="portfolio"]').click();
  await expect(page).toHaveURL(/\/#portfolio$/);
  await expect(page.locator('#portfolio')).toBeVisible();

  const root = resolve(process.cwd(), 'apps/web/src');
  const graph = [
    'App.jsx',
    'components/Layout.jsx',
    'public/components/PublicCard.jsx',
    'public/card/card-model.js',
  ].map(path => readFileSync(resolve(root, path), 'utf8')).join('\n');
  expect(graph).not.toMatch(/ContentContext|ContentProvider|useContent|localStorage|sessionStorage/);
  expect(graph).not.toMatch(/scrollIntoView|window\.scrollTo|Formspree|supabase/i);
});
