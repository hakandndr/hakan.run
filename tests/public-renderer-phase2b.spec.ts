import { expect, test, type Page } from '@playwright/test';
import {
  isolatePublicWrites,
  publishedContentResponse,
  waitForPublishedSite,
} from './helpers/published-content';

const APPROVED_HERO = {
  badge: 'Software · Cloud · Automation',
  headingLine1: 'BUILD. DEPLOY.',
  headingLine2: 'RUN.',
  paragraph: "I'm Hakan. I build software, automate the repetitive parts, and like understanding the systems underneath. My background spans IT infrastructure, cloud, and web development, so I tend to look at a product from both the code and operations side.",
  primaryButton: 'View Projects',
  primaryButtonHref: '#portfolio',
  secondaryButton: "Let's Connect",
  secondaryButtonHref: '/contact',
  profile: {
    name: 'Hakan Dundar',
    role: 'Software Developer',
    image: '/media/HakanDundar.webp',
    imageAlt: 'Hakan Dundar',
    location: 'Orange County, CA',
    topLabel: 'Years in Tech',
    topValue: '15+',
    bottomLabel: 'Software · Cloud',
    bottomValue: 'Automation',
  },
};

const PUBLISHED_SERVICES = {
  heading: 'PUBLISHED',
  headingAccent: 'EXPERTISE',
  subtitle: 'Only the validated services snapshot supplies this section.',
  filterTags: ['Published Systems', 'Published Cloud'],
  items: [
    { title: 'Published Process Alpha', description: 'Published alpha description.' },
    { title: 'Published Process Beta', description: 'Published beta description.' },
    { title: 'Published Process Gamma', description: 'Published gamma description.' },
  ],
};

const PUBLISHED_HEADER = {
  siteName: 'SNAPSHOT HEADER',
  ctaButton: 'Snapshot Contact',
  navLinks: [
    { name: 'Services', href: '/#services' },
    { name: 'Portfolio', href: '/#portfolio' },
    { name: 'About', href: '/#about' },
  ],
};

const publishedResponse = (changes: Record<string, unknown> = {}) => {
  const payload = JSON.parse(publishedContentResponse.body);
  for (const [id, data] of Object.entries(changes)) {
    payload.sections.find((section: { id: string }) => section.id === id).data = data;
  }
  return { ...publishedContentResponse, body: JSON.stringify(payload) };
};

const serve = async (page: Page, changes: Record<string, unknown> = {}) => {
  await isolatePublicWrites(page);
  await page.route('**/api/content', route => route.fulfill(publishedResponse(changes)));
  await page.addInitScript(() => {
    window.sessionStorage.setItem('hakan.run:boot-intro-seen', '1');
  });
};

test('Header renders its snapshot slice and delegates desktop navigation', async ({ page }) => {
  await serve(page, { header: PUBLISHED_HEADER });
  await page.goto('/');
  await waitForPublishedSite(page);

  const primary = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(page.locator('header')).toContainText('SNAPSHOT HEADER');
  await expect(page.locator('header')).not.toContainText('PUBLISHED SITE');
  await expect(primary.locator('a')).toHaveText([/Services/, /Portfolio/, /About/]);
  expect(await primary.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual([
    '/#services',
    '/#portfolio',
    '/#about',
  ]);
  await expect(page.locator('[data-header-logo-slash]').first()).toHaveAttribute('fill', '#ffffff');

  await primary.getByRole('link', { name: /Services/ }).click();
  await expect(page).toHaveURL(/\/#services$/);
  await primary.getByRole('link', { name: /Portfolio/ }).click();
  await expect(page).toHaveURL(/\/#portfolio$/);
  await primary.getByRole('link', { name: /About/ }).click();
  await expect(page).toHaveURL(/\/#about$/);
  await primary.getByRole('link', { name: /Services/ }).click();
  await expect(page).toHaveURL(/\/#services$/);

  await page.locator('header').getByRole('button', { name: 'Snapshot Contact' }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator('form')).toBeVisible();
});

test('Header mobile menu opens, closes, and uses the shared navigation owner', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await serve(page);
  await page.goto('/');
  await waitForPublishedSite(page);

  const toggle = page.getByRole('button', { name: 'Open navigation menu' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close navigation menu' }).first()).toBeVisible();

  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: /About/ }).click();
  await expect(page).toHaveURL(/\/#about$/);
  await expect(page.locator('#public-mobile-menu')).toHaveCount(0);
});

test('Hero renders approved snapshot content, actions, profile, and social links', async ({ page }) => {
  await serve(page, { hero: APPROVED_HERO });
  await page.goto('/');
  await waitForPublishedSite(page);

  const hero = page.locator('[data-public-section="hero"]');
  await expect(hero).toContainText(APPROVED_HERO.badge);
  await expect(hero.getByRole('heading', { level: 1 })).toContainText('BUILD. DEPLOY.');
  await expect(hero.getByRole('heading', { level: 1 })).toContainText('RUN.');
  await expect(hero).toContainText(APPROVED_HERO.paragraph);
  await expect(hero).toContainText('Hakan Dundar');
  await expect(hero).toContainText('Software Developer · Orange County, CA');
  await expect(hero).not.toContainText('Software Developer • QA Automation • Irvine, CA');
  expect(await hero.locator('a[target="_blank"]').evaluateAll(links =>
    links.map(link => link.getAttribute('href')),
  )).toEqual([
    'https://www.linkedin.com/in/hdundar/',
    'https://github.com/hakandndr',
    'https://www.instagram.com/hdundar/',
    'https://x.com/hDundar',
  ]);

  await hero.getByRole('button', { name: 'View Projects' }).click();
  await expect(page).toHaveURL(/\/#portfolio$/);
  await hero.getByRole('button', { name: "Let's Connect" }).click();
  await expect(page).toHaveURL(/\/contact$/);
});

test('MY EXPERTISE has one explicit accordion owner and only snapshot copy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await serve(page, { services: PUBLISHED_SERVICES });
  await page.goto('/');
  await waitForPublishedSite(page);

  const expertise = page.locator('[data-public-section="expertise"]');
  await expect(expertise).toContainText('PUBLISHED EXPERTISE');
  await expect(expertise.locator('[data-expertise-process]')).toHaveText([
    'Published Process Alpha',
    'Published Process Beta',
    'Published Process Gamma',
  ]);
  await expect(page.getByText('QA Automation & SDET', { exact: false })).toHaveCount(0);
  await expect(expertise.getByText('RUNNING')).toHaveCount(1);
  await expect(expertise.getByText('IDLE')).toHaveCount(2);

  const rows = expertise.locator('[data-expertise-row]');
  await expect(rows.nth(0).getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  await rows.nth(1).getByRole('button').click();
  await expect(rows.nth(0).getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  await expect(rows.nth(1).getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  await expect(rows.nth(0).locator('[data-expertise-description]')).toHaveAttribute('aria-hidden', 'true');
  await expect(rows.nth(1).locator('[data-expertise-description]')).toHaveAttribute('aria-hidden', 'false');
  await expect(rows.nth(1).locator('[data-expertise-process]')).toHaveClass(/text-accent-purple/);
  await expect(expertise.getByText('RUNNING')).toHaveCount(1);
  await expect(expertise.getByText('IDLE')).toHaveCount(2);

  await rows.nth(2).getByRole('button').click();
  await expect(rows.nth(1).getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  await expect(rows.nth(2).getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  await rows.nth(0).getByRole('button').click();
  await expect(rows.nth(2).getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  await expect(rows.nth(0).getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  await expect(expertise.getByText('RUNNING')).toHaveCount(1);

  const bounds = await expertise.locator('[data-expertise-processes]').boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
});
