import fs from 'node:fs';
import { test, expect } from '@playwright/test';

const sitemap = fs.readFileSync('apps/web/public/sitemap.xml', 'utf8');
const expectedPaths = [...sitemap.matchAll(/<loc>\s*https:\/\/hakan\.run([^<]+?)\s*<\/loc>/g)]
  .map(match => match[1]);

test('llms metadata lists only sitemap-backed public routes', async ({ request }) => {
  const response = await request.get('/llms.txt');
  expect(response.ok()).toBeTruthy();

  const content = await response.text();
  const publishedPaths = [...content.matchAll(/\]\((\/[^)]*)\):/g)].map(match => match[1]);

  expect(publishedPaths).toEqual(expectedPaths);
  expect(content).not.toContain('/control-room');
  expect(content).not.toContain('/admin');
  expect(content).not.toContain('Untitled Page');
  expect(content).not.toMatch(/\]\(\/(home|notfound|project)\):/);
});
