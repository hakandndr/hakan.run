import { test, expect, Page } from '@playwright/test';

const STALE_COPY = 'QA Automation & SDET';
const PUBLISHED_HEADING = 'PUBLISHED FROM APP_DB.';

const content = () => ({
  colors: {
    accentPurple: '#57b8ff',
    background: '#090909',
    cardBackground: '#1a1a1a',
    heroOverlay: '#000000',
  },
  typography: { headingFont: 'mono', bodySize: 'md', sectionSpacing: 'default' },
  visibility: { services: false, about: false, portfolio: false, stats: false, cta: false },
  header: { siteName: 'PUBLISHED SITE', ctaButton: 'Contact', navLinks: [] },
  hero: {
    badge: 'PUBLISHED BADGE',
    headingLine1: PUBLISHED_HEADING,
    headingLine2: 'READY.',
    paragraph: 'Published introduction.',
    primaryButton: 'Published primary',
    primaryButtonHref: '#portfolio',
    secondaryButton: 'Published secondary',
    secondaryButtonHref: '/contact',
    profile: {
      name: 'Published Name',
      role: 'Published Role',
      image: '/media/HakanDundar.webp',
      imageAlt: 'Published profile',
      location: 'Published Location',
      topLabel: 'Published Top Label',
      topValue: '15+',
      bottomLabel: 'Published Bottom Label',
      bottomValue: 'Published Bottom Value',
    },
  },
  services: { heading: 'Published services', headingAccent: 'Ready', subtitle: 'Published services intro.', filterTags: [], items: [] },
  about: {
    chips: ['Published tag'],
    block1: {
      heading: 'Published about',
      headingAccent: 'Ready',
      image: '/media/HakanDundar.webp',
      imageAlt: 'Published about image',
      sections: [{ title: 'Published story', body: 'Published story body.', period: 'Published period' }],
    },
    block2: {
      heading: 'Published location',
      headingAccent: 'Ready',
      image: '/media/hkndesk.webp',
      imageAlt: 'Published desk image',
      sections: [],
      visible: false,
    },
  },
  portfolio: {
    badge: 'Published work',
    heading: 'Published portfolio',
    headingAccent: 'Ready',
    cards: [{
      id: 1,
      slug: 'published-project',
      title: 'Published project',
      description: 'Published project description.',
      imgSrc: '/portfolio/full-stack-saas-card.svg',
      externalUrl: 'https://example.com/project',
      technology: 'Published technology',
    }],
  },
  stats: { heading: 'Published stats', headingAccent: 'Ready', items: [] },
  cta: {
    heading: 'Published CTA',
    headingAccent: 'Ready',
    headingSuffix: '.',
    paragraph: 'Published CTA description.',
    button: 'Published CTA button',
    buttonHref: '/contact',
  },
  contact: {
    pageTitle: 'Published contact',
    metaDescription: 'Published contact description.',
    heading: 'Published contact',
    headingAccent: 'Ready',
    subtitle: 'Published contact introduction.',
    infoBlocks: [],
    socialLinks: [],
  },
  footer: {
    logoText: '<h/>',
    siteName: 'PUBLISHED SITE',
    tagline: 'Published footer tagline.',
    bottomSignature: 'Published footer signature.',
    bottomLocation: 'Published footer location.',
    sections: [],
    socialLinks: [],
  },
});

const validPayload = () => {
  const current = content();
  const sections = Object.entries(current).map(([id, data]) => ({
    id,
    revision: 1,
    publishedAt: 1,
    data,
  }));
  return { contract: 1, count: sections.length, publishedAt: 1, sections };
};

const json = (body: unknown, status = 200) => ({
  status,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify(body),
});

const stub = (page: Page, response: Record<string, unknown>) =>
  page.route('**/api/content', (route) => route.fulfill(response as never));

const expectNoFallback = async (page: Page) => {
  await expect(page.getByText(STALE_COPY, { exact: false })).toHaveCount(0);
  await expect(page.getByText('BUILD. DEPLOY.', { exact: false })).toHaveCount(0);
};

test('a delayed complete APP_DB snapshot keeps the neutral shell stable until READY', async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/api/content', async (route) => {
    await gate;
    await route.fulfill(json(validPayload()));
  });

  await page.goto('/', { waitUntil: 'commit' });
  try {
    await expect(page.locator('[data-public-bootstrap="loading"]')).toBeVisible();
    await expectNoFallback(page);
  } finally {
    release();
  }

  await expect(page.locator('[data-public-bootstrap="loading"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(PUBLISHED_HEADING);
  await expectNoFallback(page);
});

test('a complete valid APP_DB snapshot reaches READY with published theme tokens', async ({ page }) => {
  await stub(page, json(validPayload()));
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText(PUBLISHED_HEADING);
  await expect(page.locator('html')).toHaveCSS('--color-bg', '#090909');
  await expect(page.locator('body')).toHaveAttribute('data-heading-font', 'mono');
});

const contractFailures = [
  {
    name: 'missing section',
    payload: () => {
      const value = validPayload();
      value.sections.pop();
      value.count = value.sections.length;
      return value;
    },
  },
  {
    name: 'duplicate section',
    payload: () => {
      const value = validPayload();
      value.sections[value.sections.length - 1] = structuredClone(value.sections[0]);
      return value;
    },
  },
  {
    name: 'malformed section',
    payload: () => {
      const value = validPayload();
      value.sections.find(({ id }) => id === 'hero')!.data = { headingLine1: 42 };
      return value;
    },
  },
  {
    name: 'unknown section',
    payload: () => {
      const value = validPayload();
      value.sections[value.sections.length - 1].id = 'unknown';
      return value;
    },
  },
];

for (const failure of contractFailures) {
  test(`${failure.name} reaches ERROR without source fallback`, async ({ page }) => {
    await stub(page, json(failure.payload()));
    await page.goto('/');

    await expect(page.locator('[data-public-bootstrap="error"]')).toBeVisible();
    await expectNoFallback(page);
    await expect(page.getByText(PUBLISHED_HEADING, { exact: false })).toHaveCount(0);
  });
}

test('transport failure reaches ERROR without source fallback', async ({ page }) => {
  await page.route('**/api/content', (route) => route.abort('failed'));
  await page.goto('/');
  await expect(page.locator('[data-public-bootstrap="error"]')).toBeVisible();
  await expectNoFallback(page);
});

test('invalid JSON reaches ERROR without source fallback', async ({ page }) => {
  await stub(page, { status: 200, contentType: 'application/json', body: '{not-json' });
  await page.goto('/');
  await expect(page.locator('[data-public-bootstrap="error"]')).toBeVisible();
  await expectNoFallback(page);
});
