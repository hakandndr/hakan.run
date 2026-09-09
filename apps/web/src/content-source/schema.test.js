import test from 'node:test';
import assert from 'node:assert/strict';
import { siteContent } from '../content.js';
import { SECTION_SCHEMAS, validateSection, editAt, newValue, safeUrl } from './schema.js';
import { composePreview, acceptPreview, previewImages } from '../boss/preview-contract.js';
test('all twelve section contracts accept the existing fallback without transformation', () => {
  assert.equal(Object.keys(SECTION_SCHEMAS).length,12);
  for (const [id,data] of Object.entries(siteContent)) assert.deepEqual(validateSection(id,data),[],id);
});
test('optional fields may be absent and future safe fields survive edits and reorder', () => {
  const input = structuredClone(siteContent.portfolio);
  input.future = { nested: [null,42,true] };
  input.cards[0].metadata = { owner: 'Hakan' };
  const changed = editAt(input,['cards',0,'title'],'Updated');
  const reordered = editAt(changed,['cards'],[changed.cards[2],changed.cards[0],changed.cards[1]]);
  assert.deepEqual(validateSection('portfolio',reordered),[]);
  assert.deepEqual(reordered.future,input.future);
  assert.equal(reordered.cards[1].id,input.cards[0].id);
  assert.deepEqual(reordered.cards[1].metadata,{ owner: 'Hakan' });
  assert.notEqual(input.cards[0].title,'Updated');
  const optional = { ...siteContent.hero, profile: { role: 'Engineer', future: 'kept' } };
  assert.deepEqual(validateSection('hero',optional),[]);
  assert.equal(editAt(optional,['profile','role'],undefined).profile.future,'kept');
});
test('invalid types, CSS, protocols and retired destinations are rejected explicitly', () => {
  for (const value of ['javascript:alert(1)','data:text/html,x','//evil.test/x','/\\evil.test',' https://example.com','https://u:p@example.com']) assert.equal(safeUrl(value),false,value);
  assert.equal(safeUrl('/contact'),true);
  assert.ok(validateSection('colors',{ ...siteContent.colors, background: 'url(https://evil.test)' }).length);
  assert.ok(validateSection('typography',{ ...siteContent.typography, bodySize: 'huge' }).length);
  assert.ok(validateSection('hero',{ ...siteContent.hero, badge: 42 }).length);
  assert.ok(validateSection('contact',{ ...siteContent.contact, formEndpoint: '/api/contact' }).length);
  for (const host of ['formspree.io','supabase.co']) assert.ok(validateSection('hero',{ ...siteContent.hero, futureUrl: `https://${host}/x` }).length);
  assert.ok(validateSection('hero',JSON.parse('{"__proto__":{}}')).length);
  assert.ok(validateSection('stats',{ ...siteContent.stats, items: [{ ...siteContent.stats.items[0], value: Infinity }] }).length);
});
test('portfolio IDs and slugs are unique; external projects need no detail route', () => {
  const p = structuredClone(siteContent.portfolio);
  p.cards[1].id = p.cards[0].id;
  assert.ok(validateSection('portfolio',p).some(e => e.path === 'cards.1.id'));
  p.cards[1].id = 99; p.cards[1].slug = 'new-project';
  assert.ok(validateSection('portfolio',p).some(e => e.path === 'cards.1.externalUrl'));
  p.cards[1].externalUrl = 'https://example.com';
  assert.deepEqual(validateSection('portfolio',p),[]);
  const fresh = newValue(SECTION_SCHEMAS.portfolio.fields.cards.item);
  assert.notEqual(fresh.id,newValue(SECTION_SCHEMAS.portfolio.fields.cards.item).id);
});
test('private snapshot overlays unsaved data only in memory, checks concurrency and identifies drafts', () => {
  const snapshot = { sections: Object.entries(siteContent).map(([id,data]) => ({ id,data,revision: 1,updatedAt: 100,draft: id === 'about' })) };
  const result = composePreview(snapshot,{ section: 'hero',data: { ...siteContent.hero,badge: 'Unsaved' },unsaved: true,expected: { expectedVersion: 100,expectedRevision: 1 } });
  assert.equal(result.sections.find(s => s.id === 'hero').data.badge,'Unsaved');
  assert.equal(result.sections.find(s => s.id === 'hero').unsaved,true);
  assert.equal(result.sections.find(s => s.id === 'about').draft,true);
  assert.equal(snapshot.sections.find(s => s.id === 'hero').data.badge,siteContent.hero.badge);
  assert.throws(() => composePreview(snapshot,{ section:'hero',data:siteContent.hero,expected:{expectedVersion:99,expectedRevision:1} }),/conflict/);
});
test('preview messages require the exact parent and origin; image references cannot send drafts out', () => {
  const parent = {}, data = { type:'cms-preview',payload:{sections:[]} };
  assert.equal(acceptPreview({source:parent,origin:'https://site.test',data},parent,'https://site.test'),true);
  assert.equal(acceptPreview({source:{},origin:'https://site.test',data},parent,'https://site.test'),false);
  assert.equal(acceptPreview({source:parent,origin:'https://evil.test',data},parent,'https://site.test'),false);
  for (const image of ['https://evil.test/leak','/api/contact','/media/x.png?draft=secret','/media/../api/x.png']) assert.equal(previewImages({image}).image,undefined);
  assert.equal(previewImages({image:'/media/HakanDundar.webp'}).image,'/media/HakanDundar.webp');
});

test('navigation destinations cannot be removed before draft save or publication', async () => {
  const { validateContent } = await import('../../../../worker/boss/content-management.js');
  for (const section of ['header', 'footer']) {
    const original = structuredClone(siteContent[section]);
    const path = section === 'header' ? ['navLinks', 0, 'href'] : ['sections', 0, 'links', 0, 'href'];
    assert.deepEqual(validateSection(section, original), []);
    assert.deepEqual(JSON.parse(validateContent(section, original)), original);
    for (const value of [undefined, null, 42]) {
      const invalid = editAt(original, path, value);
      assert.ok(validateSection(section, invalid).some(error => error.path === path.join('.')));
      assert.throws(() => validateContent(section, invalid), /content_invalid/);
    }
  }
  const headerLink = SECTION_SCHEMAS.header.fields.navLinks.item;
  const footerLink = SECTION_SCHEMAS.footer.fields.sections.item.fields.links.item;
  for (const schema of [headerLink, footerLink]) {
    assert.equal(schema.fields.href.optional, false);
    assert.equal(typeof newValue(schema).href, 'string');
  }
});
