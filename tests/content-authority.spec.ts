import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost:3000)/, route => {
    if (route.request().url().includes('/rest/v1/site_content')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    return route.abort();
  });
});

test('does not render fallback content while Supabase content is unresolved', async ({ page }) => {
  let releaseResponse;
  let markRequestStarted;
  const responseGate = new Promise(resolve => { releaseResponse = resolve; });
  const requestStarted = new Promise(resolve => { markRequestStarted = resolve; });

  await page.route('**/rest/v1/site_content*', async route => {
    markRequestStarted();
    await responseGate;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          section: 'hero',
          data: {
            badge: 'REMOTE HERO READY',
            headingLine1: 'REMOTE HERO',
            headingLine2: 'CONTENT',
            paragraph: 'REMOTE HERO PARAGRAPH',
            primaryButton: 'REMOTE PRIMARY',
            primaryButtonHref: '#portfolio',
            secondaryButton: 'REMOTE SECONDARY',
            secondaryButtonHref: '/contact',
            profile: {
              image: '/media/HakanDundar.webp',
              imageAlt: 'Remote hero image',
              name: 'REMOTE PROFILE',
              role: 'REMOTE ROLE',
              location: 'REMOTE LOCATION',
              topValue: 'REMOTE TOP',
              topLabel: 'REMOTE TOP LABEL',
              bottomLabel: 'REMOTE BOTTOM LABEL',
              bottomValue: 'REMOTE BOTTOM',
            },
          },
        },
        {
          section: 'portfolio',
          data: {
            badge: 'REMOTE PORTFOLIO BADGE',
            heading: 'REMOTE PORTFOLIO',
            headingAccent: 'CONTENT',
            subtitle: '',
            cards: [{
              id: 501,
              slug: 'remote-project',
              title: 'REMOTE PROJECT READY',
              description: 'Remote project description',
              imgSrc: '/portfolio/full-stack-saas-card.svg',
              externalUrl: '',
              technology: 'REMOTE STACK',
            }],
          },
        },
        {
          section: 'about',
          data: {
            chips: ['REMOTE ABOUT CHIP'],
            block1: {
              heading: 'REMOTE ABOUT',
              headingAccent: 'CONTENT',
              image: '/media/HakanDundar.webp',
              imageAlt: 'Remote about image',
              sections: [],
            },
            block2: {
              visible: false,
              heading: '',
              headingAccent: '',
              image: '/media/hkndesk.webp',
              imageAlt: '',
              sections: [],
            },
          },
        },
      ]),
    });
  });

  await page.addInitScript(() => {
    window.sessionStorage.setItem('booted', '1');
    window.localStorage.removeItem('siteContent');
  });

  await page.goto('/');
  await requestStarted;

  await expect(page.locator('#root')).toBeEmpty();
  await expect(page.getByRole('heading', { name: /BUILD\. DEPLOY\. RUN\./ })).toHaveCount(0);
  await expect(page.getByText('Full Stack Development', { exact: true })).toHaveCount(0);
  await expect(page.getByText('AI & Automation', { exact: true })).toHaveCount(0);
  await expect(page.getByText('From Systems to', { exact: true })).toHaveCount(0);

  releaseResponse();

  await expect(page.getByText('REMOTE HERO READY', { exact: true })).toBeVisible();
  await expect(page.getByText('REMOTE PROJECT READY', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /REMOTE ABOUT CONTENT/ })).toBeVisible();
});

test('persisted Hero and About content reaches the public homepage', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('booted', '1');
    window.localStorage.setItem('siteContent', JSON.stringify({
      hero: {
        badge: 'CMS HERO BADGE',
        headingLine1: 'CMS HERO LINE ONE',
        headingLine2: 'CMS HERO LINE TWO',
        paragraph: 'CMS HERO PARAGRAPH',
        primaryButton: 'CMS PRIMARY',
        primaryButtonHref: '#portfolio',
        secondaryButton: 'CMS SECONDARY',
        secondaryButtonHref: '/contact',
        profile: {
          image: '/media/HakanDundar.webp',
          imageAlt: 'CMS HERO PROFILE IMAGE',
          name: 'CMS PROFILE NAME',
          role: 'CMS PROFILE ROLE',
          location: 'CMS PROFILE LOCATION',
          topValue: 'CMS TOP VALUE',
          topLabel: 'CMS TOP LABEL',
          bottomLabel: 'CMS BOTTOM LABEL',
          bottomValue: 'CMS BOTTOM VALUE',
        },
      },
      about: {
        chips: ['CMS ABOUT CHIP ONE', 'CMS ABOUT CHIP TWO'],
        block1: {
          heading: 'CMS ABOUT HEADING',
          headingAccent: 'CMS ABOUT ACCENT',
          image: '/media/HakanDundar.webp',
          imageAlt: 'CMS ABOUT IMAGE',
          sections: [
            { title: 'CMS ABOUT TITLE ONE', body: 'CMS ABOUT BODY ONE' },
            { title: 'CMS ABOUT TITLE TWO', body: 'CMS ABOUT BODY TWO' },
          ],
        },
        block2: {
          visible: true,
          heading: 'CMS BLOCK TWO',
          headingAccent: 'CMS BLOCK TWO ACCENT',
          image: '/media/hkndesk.webp',
          imageAlt: 'CMS BLOCK TWO IMAGE',
          sections: [
            { title: 'CMS BLOCK TWO TITLE', body: 'CMS BLOCK TWO BODY' },
          ],
        },
      },
    }));
  });

  await page.goto('/');

  await expect(page.getByText('CMS HERO BADGE', { exact: true })).toBeVisible();
  await expect(page.getByText('CMS HERO PARAGRAPH', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /CMS HERO LINE ONE CMS HERO LINE TWO/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /CMS PRIMARY/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'CMS SECONDARY' })).toBeVisible();
  await expect(page.getByText('CMS TOP VALUE', { exact: true })).toHaveText('CMS TOP VALUE');
  await expect(page.getByText('CMS TOP LABEL', { exact: true })).toHaveText('CMS TOP LABEL');
  await expect(page.getByText('CMS BOTTOM LABEL', { exact: true })).toHaveText('CMS BOTTOM LABEL');
  await expect(page.getByText('CMS BOTTOM VALUE', { exact: true })).toHaveText('CMS BOTTOM VALUE');
  await expect(page.getByText('CMS PROFILE NAME', { exact: true })).toHaveText('CMS PROFILE NAME');
  await expect(page.getByText('CMS PROFILE ROLE · CMS PROFILE LOCATION', { exact: true }))
    .toHaveText('CMS PROFILE ROLE · CMS PROFILE LOCATION');
  await expect(page.getByAltText('CMS HERO PROFILE IMAGE')).toHaveAttribute('src', '/media/HakanDundar.webp');

  await expect(page.getByRole('heading', { name: /CMS ABOUT HEADING CMS ABOUT ACCENT/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'CMS ABOUT TITLE ONE' })).toBeVisible();
  await expect(page.getByText('CMS ABOUT BODY TWO', { exact: true })).toBeVisible();
  await expect(page.getByAltText('CMS ABOUT IMAGE')).toBeVisible();
  await expect(page.getByText('CMS ABOUT CHIP ONE', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /CMS BLOCK TWO CMS BLOCK TWO ACCENT/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'CMS BLOCK TWO TITLE' })).toBeVisible();
  await expect(page.getByText('CMS BLOCK TWO BODY', { exact: true })).toBeVisible();
  await expect(page.getByAltText('CMS BLOCK TWO IMAGE')).toBeVisible();
});

test('legacy About content keeps block 2 visible when the visibility field is absent', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('booted', '1');
    window.localStorage.setItem('siteContent', JSON.stringify({
      about: {
        chips: [],
        block1: {
          heading: 'LEGACY BLOCK ONE',
          headingAccent: 'VISIBLE',
          image: '/media/HakanDundar.webp',
          imageAlt: 'Legacy block one image',
          sections: [],
        },
        block2: {
          heading: 'LEGACY BLOCK TWO',
          headingAccent: 'DEFAULT VISIBLE',
          image: '/media/hkndesk.webp',
          imageAlt: 'Legacy block two image',
          sections: [],
        },
      },
    }));
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /LEGACY BLOCK TWO DEFAULT VISIBLE/ })).toBeVisible();
  await expect(page.getByAltText('Legacy block two image')).toBeVisible();
});

test('About block 2 visibility does not affect block 1', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('booted', '1');
    window.localStorage.setItem('siteContent', JSON.stringify({
      about: {
        chips: [],
        block1: {
          heading: 'VISIBLE BLOCK ONE',
          headingAccent: 'STAYS VISIBLE',
          image: '/media/HakanDundar.webp',
          imageAlt: 'Visible block one image',
          sections: [
            { title: 'VISIBLE BLOCK ONE TITLE', body: 'VISIBLE BLOCK ONE BODY' },
          ],
        },
        block2: {
          visible: false,
          heading: 'HIDDEN BLOCK TWO',
          headingAccent: 'HIDDEN ACCENT',
          image: '/media/hkndesk.webp',
          imageAlt: 'Hidden block two image',
          sections: [
            { title: 'HIDDEN BLOCK TWO TITLE', body: 'HIDDEN BLOCK TWO BODY' },
          ],
        },
      },
    }));
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /VISIBLE BLOCK ONE STAYS VISIBLE/ })).toBeVisible();
  await expect(page.getByText('VISIBLE BLOCK ONE BODY', { exact: true })).toBeVisible();
  await expect(page.getByText('HIDDEN BLOCK TWO', { exact: true })).toHaveCount(0);
  await expect(page.getByText('HIDDEN BLOCK TWO BODY', { exact: true })).toHaveCount(0);
  await expect(page.getByAltText('Hidden block two image')).toHaveCount(0);
});

test('persisted Portfolio badge reaches the public homepage', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('booted', '1');
    window.localStorage.setItem('siteContent', JSON.stringify({
      portfolio: {
        badge: 'CMS PORTFOLIO BADGE',
        heading: 'CMS PORTFOLIO HEADING',
        headingAccent: 'CMS PORTFOLIO ACCENT',
        subtitle: 'CMS PORTFOLIO SUBTITLE',
        cards: [
          {
            id: 999,
            slug: 'full-stack-development',
            title: 'CMS PORTFOLIO CARD',
            description: 'CMS PORTFOLIO DESCRIPTION',
            imgSrc: '/portfolio/full-stack-saas-card.svg',
            externalUrl: '',
            technology: 'CMS TECHNOLOGY',
          },
        ],
      },
    }));
  });

  await page.goto('/');

  await expect(page.getByText('CMS PORTFOLIO BADGE', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /CMS PORTFOLIO HEADING CMS PORTFOLIO ACCENT/ })).toBeVisible();
  await expect(page.getByText('CMS PORTFOLIO CARD', { exact: true })).toBeVisible();
  await expect(page.getByText('CMS TECHNOLOGY', { exact: true })).toBeVisible();
  await expect(page.getByText('CMS PORTFOLIO SUBTITLE', { exact: true })).toHaveCount(0);
});

test('persisted Footer bottom bar content reaches the public homepage', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('booted', '1');
    window.localStorage.setItem('siteContent', JSON.stringify({
      footer: {
        logoText: '<cms/>',
        siteName: 'CMS FOOTER',
        tagline: 'CMS FOOTER TAGLINE',
        copyright: 'Legacy editor field',
        bottomSignature: 'CMS BOTTOM SIGNATURE',
        bottomLocation: 'CMS BOTTOM LOCATION',
        sections: [],
        socialLinks: [],
      },
    }));
  });

  await page.goto('/');

  await expect(page.getByText('CMS BOTTOM SIGNATURE', { exact: true })).toBeVisible();
  await expect(page.getByText('CMS BOTTOM LOCATION', { exact: true })).toBeVisible();
});

test('legacy Footer content uses safe bottom bar defaults', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('booted', '1');
    window.localStorage.setItem('siteContent', JSON.stringify({
      footer: {
        logoText: '<legacy/>',
        siteName: 'LEGACY FOOTER',
        tagline: 'LEGACY FOOTER TAGLINE',
        copyright: 'Legacy editor field',
        sections: [],
        socialLinks: [],
      },
    }));
  });

  await page.goto('/');

  await expect(page.getByText('© 2026 Hakan.run — Built under DNDR Labs.', { exact: true })).toBeVisible();
  await expect(page.getByText('Orange County, CA USA', { exact: true })).toBeVisible();
});
