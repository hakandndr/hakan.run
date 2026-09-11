import type { Page, Route } from '@playwright/test';
import { completeSiteContent } from '../../apps/web/test-fixtures/published-site.js';

const publishedAt = 1_789_081_238_918;
const content = completeSiteContent();

export const publishedContentResponse = {
  status: 200,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify({
    contract: 1,
    count: Object.keys(content).length,
    publishedAt,
    sections: Object.entries(content).map(([id, data]) => ({
      id,
      data,
      revision: 1,
      publishedAt,
    })),
  }),
};

export const fulfillPublishedContent = (route: Route) =>
  route.fulfill(publishedContentResponse);

export const isolatePublicWrites = async (page: Page) => {
  await page.route('**/api/analytics/page', route =>
    route.fulfill({
      status: 202,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ status: 'recorded' }),
    }));
};

export const waitForPublishedSite = async (page: Page) => {
  await page.locator('#services').waitFor({ state: 'attached' });
};
