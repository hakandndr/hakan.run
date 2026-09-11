import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  isolatePublicWrites,
  publishedContentResponse,
  waitForPublishedSite,
} from './helpers/published-content';

const responseWith = (changes: Record<string, unknown>) => {
  const payload = JSON.parse(publishedContentResponse.body);
  for (const [id, data] of Object.entries(changes)) {
    payload.sections.find((section: { id: string }) => section.id === id).data = data;
  }
  return { ...publishedContentResponse, body: JSON.stringify(payload) };
};

const serve = async (page: Page, changes: Record<string, unknown>) => {
  await isolatePublicWrites(page);
  await page.route('**/api/content', route => route.fulfill(responseWith(changes)));
  await page.addInitScript(() => {
    window.sessionStorage.setItem('hakan.run:boot-intro-seen', '1');
  });
};

const defaultSection = (id: string) => {
  const payload = JSON.parse(publishedContentResponse.body);
  return payload.sections.find((section: { id: string }) => section.id === id).data;
};

test('Stats renders only its immutable snapshot slice and is reduced-motion safe', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const stats = {
    ...defaultSection('stats'),
    heading: 'SNAPSHOT',
    headingAccent: 'METRICS',
    items: [
      { value: 7, suffix: '', label: 'Published Empty Suffix', description: 'No suffix is intentional.' },
      { value: 42, suffix: '+', label: 'Published Total', description: 'Snapshot supplied description.' },
    ],
  };
  await serve(page, { stats });
  await page.goto('/');
  await waitForPublishedSite(page);

  const section = page.locator('[data-public-section="stats"]');
  await expect(section).toContainText('SNAPSHOT METRICS');
  await expect(section.locator('[data-stat-card]')).toHaveCount(2);
  await expect(section.locator('[data-stat-card]').first()).toContainText(/^7Published Empty SuffixNo suffix is intentional\.$/);
  await expect(section.locator('[data-stat-card]').nth(1)).toContainText('42+');
  await expect(section).not.toContainText('Years in Tech');
});

test('Portfolio renders published external cards without an internal detail route', async ({ page }) => {
  const portfolio = {
    ...defaultSection('portfolio'),
    badge: 'PUBLISHED WORK',
    heading: 'SNAPSHOT',
    headingAccent: 'PROJECTS',
    cards: [
      {
        id: 901,
        slug: 'published-alpha',
        title: 'Published Alpha',
        description: 'Alpha project from the snapshot.',
        imgSrc: '/portfolio/dndr-labs.webp',
        externalUrl: 'https://example.com/alpha',
        technology: 'Published Stack A',
      },
      {
        id: 902,
        slug: 'published-beta',
        title: 'Published Beta',
        description: 'Beta project from the snapshot.',
        imgSrc: '/portfolio/turkcyber.webp',
        externalUrl: 'https://example.com/beta',
        technology: 'Published Stack B',
      },
    ],
  };
  await serve(page, { portfolio });
  await page.goto('/');
  await waitForPublishedSite(page);

  const cards = page.locator('[data-public-section="portfolio"] [data-portfolio-card]');
  await expect(cards).toHaveCount(2);
  await expect(cards).toHaveText([/Published Alpha.*Published Stack A/s, /Published Beta.*Published Stack B/s]);
  expect(await cards.evaluateAll(links => links.map(link => ({
    href: link.getAttribute('href'),
    target: link.getAttribute('target'),
  })))).toEqual([
    { href: 'https://example.com/alpha', target: '_blank' },
    { href: 'https://example.com/beta', target: '_blank' },
  ]);
  await page.goto('/project/published-alpha');
  await expect(page.getByText('404')).toBeVisible();
});

test('About renders published timeline, periods, images, and chips on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const about = structuredClone(defaultSection('about'));
  about.block1.heading = 'SNAPSHOT';
  about.block1.headingAccent = 'BACKGROUND';
  about.block1.sections = [{ period: '2001—NOW', title: 'Published Timeline', body: 'Published timeline body.' }];
  about.block1.imageAlt = 'Published portrait';
  about.block2.heading = 'PUBLISHED';
  about.block2.headingAccent = 'PERSPECTIVE';
  about.block2.sections = [{ title: 'Published Context', body: 'Published context body.' }];
  about.chips = ['Snapshot chip A', 'Snapshot chip B'];
  await serve(page, { about });
  await page.goto('/');
  await waitForPublishedSite(page);

  const section = page.locator('[data-public-section="about"]');
  await expect(section).toContainText('SNAPSHOT BACKGROUND');
  await expect(section).toContainText('2001—NOW');
  await expect(section).toContainText('Published Timeline');
  await expect(section).toContainText('Published context body.');
  await expect(section.locator('[data-about-chip]')).toHaveText(['Snapshot chip A', 'Snapshot chip B']);
  await expect(section.getByAltText('Published portrait')).toBeVisible();
  await expect(section).not.toContainText('15 Years of Systemic Thinking');
});

test('CTA uses snapshot copy and delegates its published destination', async ({ page }) => {
  const cta = {
    ...defaultSection('cta'),
    heading: 'SNAPSHOT CTA',
    headingAccent: 'TARGET',
    headingSuffix: '!',
    paragraph: 'Published CTA paragraph.',
    button: 'Go to About',
    buttonHref: '/#about',
  };
  await serve(page, { cta });
  await page.goto('/');
  await waitForPublishedSite(page);

  const section = page.locator('[data-public-section="cta"]');
  await expect(section).toContainText('SNAPSHOT CTA TARGET!');
  await expect(section).toContainText('Published CTA paragraph.');
  await section.getByRole('button', { name: 'Go to About' }).click();
  await expect(page).toHaveURL(/\/#about$/);
});

test('Footer renders its snapshot slice, white slash, external links, and coordinated hash navigation', async ({ page }) => {
  const footer = structuredClone(defaultSection('footer'));
  footer.logoText = '<h/>';
  footer.siteName = 'SNAPSHOT FOOTER';
  footer.tagline = 'Published footer tagline.';
  footer.bottomSignature = 'Published footer signature';
  footer.bottomLocation = 'Published footer location';
  footer.socialLinks = [{ name: 'Github', url: 'https://example.com/social' }];
  footer.sections = [{
    title: 'Published Navigation',
    links: [{ name: 'Published About', href: '/#about' }],
  }];
  await serve(page, { footer });
  await page.goto('/');
  await waitForPublishedSite(page);

  const section = page.locator('[data-public-section="footer"]');
  await expect(section).toContainText('SNAPSHOT FOOTER');
  await expect(section).toContainText('Published footer signature');
  await expect(section).toContainText('Published footer location');
  await expect(section.locator('[data-footer-logo-slash]')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(section.locator('a[href="https://example.com/social"]')).toHaveAttribute('target', '_blank');
  await section.getByRole('link', { name: /Published About/ }).click();
  await expect(page).toHaveURL(/\/#about$/);
});

test('Contact renders explicit snapshot copy while preserving labels and autocomplete', async ({ page }) => {
  const contact = structuredClone(defaultSection('contact'));
  contact.pageTitle = 'Snapshot Contact';
  contact.metaDescription = 'Snapshot contact description.';
  contact.heading = 'SNAPSHOT';
  contact.headingAccent = 'CONTACT';
  contact.subtitle = 'Published contact subtitle.';
  contact.infoBlocks = [{ title: 'Published Info', lines: ['published@example.com'] }];
  contact.socialLinks = [{ name: 'Published Social', url: 'https://example.com/contact-social' }];
  await serve(page, { contact });
  await page.route('**/api/config', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ contract: 1, environment: 'test', turnstileSiteKey: null }),
  }));
  await page.goto('/contact');

  const section = page.locator('[data-public-section="contact"]');
  await expect(page).toHaveTitle('Snapshot Contact');
  await expect(section).toContainText('SNAPSHOT CONTACT');
  await expect(section).toContainText('Published contact subtitle.');
  await expect(section).toContainText('published@example.com');
  await expect(section.locator('a[href="https://example.com/contact-social"]')).toBeVisible();
  await expect(section).not.toContainText("Let's Collaborate");
  await expect(page.getByLabel('--name')).toHaveAttribute('autocomplete', 'name');
  await expect(page.getByLabel('--email')).toHaveAttribute('autocomplete', 'email');
  await expect(page.getByLabel('--message')).not.toHaveAttribute('autocomplete', /.+/);
});

test('source graph has one explicit renderer per migrated section and no component-owned scroll', () => {
  const root = resolve(process.cwd(), 'apps/web/src');
  const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
  const graph = [
    'Application.jsx',
    'App.jsx',
    'components/Layout.jsx',
    'public/PublicBootstrap.jsx',
    'public/PublicHome.jsx',
    'public/PublicRenderer.jsx',
    'public/components/PublicStats.jsx',
    'public/components/PublicPortfolio.jsx',
    'public/components/PublicAbout.jsx',
    'public/components/PublicCTA.jsx',
    'public/components/PublicFooter.jsx',
    'public/components/PublicContact.jsx',
  ].map(read).join('\n');

  expect(graph).not.toMatch(/ContentContext|ContentProvider|useContent|from ['"][^'"]*content(?:\.js)?['"]/);
  expect(graph).not.toMatch(/scrollIntoView|window\.scrollTo|Formspree|formspree|supabase/i);
  expect(graph).not.toMatch(/\/project\//);
  for (const name of ['PublicStats', 'PublicPortfolio', 'PublicAbout', 'PublicCTA', 'PublicFooter', 'PublicContact']) {
    expect((graph.match(new RegExp(`const ${name} =`, 'g')) ?? []).length).toBe(1);
  }
});
