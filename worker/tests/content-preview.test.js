import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.js';
import { contentPreview, previewShell, PREVIEW_CSP } from '../boss/content-preview.js';
import { siteContent } from '../../apps/web/src/content.js';
const rows = () => Object.entries(siteContent).map(([section,data]) => ({ section,published_data:JSON.stringify(data),draft_data:null,published_revision:1,updated_at:100 }));
const envFor = results => ({ APP_DB: { prepare(sql) { assert.match(sql,/^SELECT/); return { all: async () => ({results}) }; } } });
test('private preview shell and data fail closed before any storage or asset read', async () => {
  for (const path of ['/boss/content/preview','/api/boss/content/preview']) {
    const response = await worker.fetch(new Request(`https://example.com${path}`),{APP_DB:{prepare(){throw Error('read');}},ASSETS:{fetch(){throw Error('asset');}}},{});
    assert.equal(response.status,403);
  }
});
test('saved preview reads drafts and published sections without any writes and disables caching', async () => {
  const data = rows(); data.find(r => r.section === 'hero').draft_data = JSON.stringify({...siteContent.hero,badge:'Private'});
  const response = await contentPreview(envFor(data));
  assert.equal(response.status,200); assert.match(response.headers.get('cache-control'),/no-store/);
  const payload = await response.json();
  assert.equal(payload.sections.find(s => s.id === 'hero').data.badge,'Private');
  assert.equal(payload.sections.find(s => s.id === 'hero').draft,true);
  assert.equal(payload.sections.find(s => s.id === 'about').draft,false);
});
test('incomplete or corrupt saved previews fail rather than substitute public/fallback content', async () => {
  assert.equal((await contentPreview(envFor(rows().slice(1)))).status,409);
  const data=rows();data[0].draft_data='null';
  assert.equal((await contentPreview(envFor(data))).status,409);
});
test('preview shell removes tracking and provides a restrictive response policy', async () => {
  const html = '<html><head><script src="https://evil.test/tracker"></script><script>alert(1)</script><link rel="stylesheet" href="/assets/x.css"></head><body><script type="module" crossorigin src="/assets/x.js"></script></body></html>';
  const response = await previewShell(new Request('https://site.test/boss/content/preview'),{ASSETS:{fetch:async()=>new Response(html)}});
  const body=await response.text();
  assert.equal(response.status,200);assert.doesNotMatch(body,/evil|alert/);assert.match(body,/\/assets\/x.js/);
  assert.equal(response.headers.get('content-security-policy'),PREVIEW_CSP);
  assert.match(PREVIEW_CSP,/connect-src 'none'/);assert.match(PREVIEW_CSP,/form-action 'none'/);
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  assert.match(response.headers.get('cache-control'),/no-store/);
});

test('the actual router allows only a cryptographically verified owner for preview', async () => {
  const pair = await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
  const jwk = await crypto.subtle.exportKey('jwk',pair.publicKey); jwk.kid='preview-test';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({keys:[jwk]}));
  const env = { ...envFor(rows()), ACCESS_TEAM_DOMAIN:'preview-unit.example',ACCESS_AUD_BOSS:'preview-aud',BOSS_OWNER_EMAIL:'hakan@dndr.net',ASSETS:{fetch:async()=>new Response('<script type="module" src="/assets/app.js"></script>')} };
  const token = async (overrides={}) => {
    const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    const unsigned = `${encode({alg:'RS256',kid:jwk.kid})}.${encode({iss:'https://preview-unit.example',aud:['preview-aud'],exp:Math.floor(Date.now()/1000)+60,email:'hakan@dndr.net',...overrides})}`;
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(unsigned));
    return `${unsigned}.${Buffer.from(signature).toString('base64url')}`;
  };
  try {
    for (const path of ['/api/boss/content/preview','/boss/content/preview']) {
      for (const [claims,status] of [[{},200],[{email:'other@example.com'},403],[{exp:1},403],[{aud:['wrong']},403]]) {
        const response=await worker.fetch(new Request(`https://site.test${path}`,{headers:{'cf-access-jwt-assertion':await token(claims)}}),env,{});
        assert.equal(response.status,status);
      }
    }
  } finally { globalThis.fetch=originalFetch; }
});
