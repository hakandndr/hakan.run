import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost:3000)/, route => route.abort());
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
      },
      about: {
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
          heading: 'LEGACY BLOCK TWO',
          headingAccent: 'NOT RENDERED',
          image: '/media/hkndesk.webp',
          imageAlt: 'Legacy block two image',
          sections: [],
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

  await expect(page.getByRole('heading', { name: /CMS ABOUT HEADING CMS ABOUT ACCENT/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'CMS ABOUT TITLE ONE' })).toBeVisible();
  await expect(page.getByText('CMS ABOUT BODY TWO', { exact: true })).toBeVisible();
  await expect(page.getByAltText('CMS ABOUT IMAGE')).toBeVisible();
  await expect(page.getByText('LEGACY BLOCK TWO', { exact: true })).toHaveCount(0);
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
          },
        ],
      },
    }));
  });

  await page.goto('/');

  await expect(page.getByText('CMS PORTFOLIO BADGE', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /CMS PORTFOLIO HEADING CMS PORTFOLIO ACCENT/ })).toBeVisible();
  await expect(page.getByText('CMS PORTFOLIO CARD', { exact: true })).toBeVisible();
  await expect(page.getByText('CMS PORTFOLIO SUBTITLE', { exact: true })).toHaveCount(0);
});
