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
