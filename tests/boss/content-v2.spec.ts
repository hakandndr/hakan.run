import { test, expect, Page } from '@playwright/test';
import { siteContent } from '../../apps/web/src/content.js';
import { previewShell } from '../../worker/boss/content-preview.js';

// Local browser acceptance uses in-memory API fixtures and the actual private
// shell builder. No Access bypass is added to the application or Worker.
async function setup(page: Page, conflict = false) {
  const records = Object.fromEntries(Object.entries(structuredClone(siteContent)).map(([section,published]) => [section,{ section,published,draft:null,updatedAt:100,publishedRevision:1 }]));
  records.hero.published.future = { owner:'Hakan', flags:[1,true] };
  records.about.draft = { ...records.about.published, chips:['Saved draft tag'] };
  let writes = 0;
  await page.route('**/*', async route => {
    const req=route.request(), u=new URL(req.url());
    if (u.origin !== 'http://localhost:4173') return route.abort();
    if (u.pathname === '/boss/content/preview') {
      const asset = await route.fetch();
      const shell = await previewShell(new Request(req.url()),{ASSETS:{fetch:async()=>new Response(await asset.text())}});
      return route.fulfill({status:shell.status,headers:Object.fromEntries(shell.headers),body:await shell.text()});
    }
    if (u.pathname === '/api/content') return route.fulfill({json:{contract:1,count:12,sections:Object.values(records).map(r => ({id:r.section,data:r.published}))}});
    if (u.pathname === '/api/boss/content/preview') return route.fulfill({json:{sections:Object.values(records).map(r=>({id:r.section,data:r.draft??r.published,draft:!!r.draft,updatedAt:r.updatedAt,revision:r.publishedRevision}))}});
    if (u.pathname === '/api/boss/content') return route.fulfill({json:{sections:Object.values(records).map(r=>({section:r.section,published_revision:1}))}});
    if (u.pathname.startsWith('/api/boss/content/')) {
      const parts=u.pathname.split('/'), record=records[parts[4]];
      if (!record) return route.fulfill({status:404,json:{error:'not_found'}});
      if (req.method() !== 'GET') {
        if (req.method() !== 'PUT' || parts[5] !== 'draft') return route.fulfill({status:405,json:{error:'fixture_supports_draft_save_only'}});
        writes++;
        if (conflict) return route.fulfill({status:409,json:{error:'content_conflict'}});
        const body=req.postDataJSON();
        expect(body.expectedVersion).toBe(record.updatedAt);
        expect(body.expectedRevision).toBe(record.publishedRevision);
        record.draft=body.data;record.updatedAt++;
      }
      return route.fulfill({json:record});
    }
    if (u.pathname.startsWith('/api/') || u.pathname.startsWith('/run/')) return route.fulfill({status:404,json:{error:'not_found'}});
    return route.continue();
  });
  await page.goto('/boss/content');
  return {records,writes:()=>writes};
}
test('all twelve sections expose fields and advanced JSON preserves extra data',async({page})=>{
  const fixture=await setup(page);
  for(const section of ['hero','services','portfolio','about','header','footer','cta','contact','stats','colors','typography','visibility']) {
    await page.getByLabel('Content section',{exact:true}).selectOption(section);
    await expect(page.getByText(`Edit ${section}`,{exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Advanced JSON',exact:true})).toBeVisible();
    await expect(page.locator(`[id^="cms-${section}-"]`).first()).toBeVisible();
  }
  await page.getByLabel('Content section',{exact:true}).selectOption('hero');
  await page.getByLabel('Badge',{exact:true}).fill('Edited field');
  await page.getByRole('button',{name:'Save draft',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('draft completed');
  expect(fixture.records.hero.draft.future).toEqual({owner:'Hakan',flags:[1,true]});
  await page.getByRole('button',{name:'Advanced JSON',exact:true}).click();
  await expect(page.getByLabel('Section JSON')).toContainText('Edited field');
  if (process.env.CMS_V2_MANUAL === '1') await page.pause();
});
test('stale save preserves the edited value',async({page})=>{
  await setup(page,true);
  await page.getByLabel('Content section',{exact:true}).selectOption('hero');
  await page.getByLabel('Badge',{exact:true}).fill('Keep my change');
  await page.getByRole('button',{name:'Save draft',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Content conflict');
  await expect(page.getByLabel('Badge',{exact:true})).toHaveValue('Keep my change');
});
test('portfolio reorder retains IDs and new external projects can be added',async({page})=>{
  const fixture=await setup(page);
  await page.getByLabel('Content section',{exact:true}).selectOption('portfolio');
  await page.getByRole('button',{name:'Move Project 1 down',exact:true}).click();
  await page.getByRole('button',{name:'Add Project',exact:true}).click();
  await page.locator('#cms-portfolio-cards\\.3\\.slug').fill('new-project');
  await page.locator('#cms-portfolio-cards\\.3\\.title').fill('New project');
  await page.locator('#cms-portfolio-cards\\.3\\.description').fill('Description');
  await page.getByRole('button',{name:'Set External URL',exact:true}).last().click();
  await page.locator('#cms-portfolio-cards\\.3\\.externalUrl').fill('https://example.com');
  await page.getByRole('button',{name:'Save draft',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('draft completed');
  expect(fixture.records.portfolio.draft.cards.map(c=>c.id).slice(0,3)).toEqual([2,1,3]);
  expect(fixture.records.portfolio.draft.cards[3].externalUrl).toBe('https://example.com');
});
test('unsaved preview uses public components without writes, storage or outbound interactions',async({page},testInfo)=>{
  const fixture=await setup(page);
  await page.getByLabel('Content section',{exact:true}).selectOption('hero');
  await page.getByLabel('Badge',{exact:true}).fill('PRIVATE UNSAVED BADGE');
  await page.screenshot({path:testInfo.outputPath('editor.png')});
  const before=await page.evaluate(()=>localStorage.getItem('siteContent'));
  const requests:string[]=[];
  page.on('request',req=>{if(req.frame() !== page.mainFrame()) requests.push(req.url());});
  await page.getByRole('button',{name:'Preview current edits',exact:true}).click();
  await expect(page.getByText(/hero: unsaved edits/)).toBeVisible();
  await expect(page.getByText(/about: saved draft/)).toBeVisible();
  const frame=page.frameLocator('iframe');
  await expect(frame.getByText('PRIVATE UNSAVED BADGE',{exact:true})).toBeVisible();
  await frame.getByText('PRIVATE UNSAVED BADGE',{exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('preview.png')});
  await frame.getByRole('button',{name:'View Projects',exact:true}).click();
  await page.getByLabel('Preview page',{exact:true}).selectOption('contact');
  await expect(frame.locator('input[name="name"]')).toBeVisible();
  await expect(frame.getByRole('button',{name:/send/i})).toBeDisabled();
  await expect(frame.locator('a[href]')).toHaveCount(0);
  const child=page.frames().find(f=>f.url().endsWith('/boss/content/preview'))!;
  expect(await child.evaluate(async()=>{try {await fetch('/api/contact',{method:'POST',body:'secret'});return false;}catch{return true;}})).toBe(true);
  expect(requests.filter(url=>/\/api\/|\/run\/|evil|google|turnstile/.test(url))).toEqual([]);
  expect(fixture.writes()).toBe(0);
  expect(fixture.records.hero.draft).toBeNull();
  expect(await page.evaluate(()=>localStorage.getItem('siteContent'))).toBe(before);
  await expect(page.getByLabel('Badge',{exact:true})).toHaveValue('PRIVATE UNSAVED BADGE');
});
