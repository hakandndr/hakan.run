import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.js';
import { previewHeaders, PREVIEW_CSP } from '../boss/content-preview.js';
import {
  COMMON_HEADERS,
  CONTENT_SECURITY_POLICY,
  FRAMING_POLICY,
  HSTS,
  documentHeaders,
  renderHeadersFile,
  withSecurityHeaders,
} from '../lib/security-headers.js';

const html = (body = '<p>x</p>', headers = {}) => new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8', ...headers } });
const assets = (factory) => ({ ASSETS: { fetch: async () => factory() } });
const cspValues = (response) => [
  response.headers.get('content-security-policy'),
  response.headers.get('content-security-policy-report-only'),
].filter(Boolean);

test('the generated _headers file is rendered from the same policy the Worker applies', () => {
  for (const mode of ['report-only', 'enforce']) {
    const file = renderHeadersFile(mode);
    const rules = file.split('\n').filter((line) => line.startsWith('  ')).map((line) => line.trim());
    const expected = Object.entries({ ...COMMON_HEADERS, ...documentHeaders(mode) }).map(([name, value]) => `${name}: ${value}`);
    assert.deepEqual(rules, expected, mode);
    assert.match(file, /^\/\*$/m);
  }
});

test('HSTS is one day without includeSubDomains or preload, and only over HTTPS', () => {
  assert.equal(HSTS, 'max-age=86400');
  const secure = withSecurityHeaders(new Request('https://hakan.run/'), html());
  assert.equal(secure.headers.get('strict-transport-security'), 'max-age=86400');
  const plain = withSecurityHeaders(new Request('http://hakan.run/'), html('<p>x</p>', { 'strict-transport-security': HSTS }));
  assert.equal(plain.headers.get('strict-transport-security'), null, 'inherited HSTS is removed over HTTP');
  assert.equal(plain.headers.get('x-content-type-options'), 'nosniff');
});

test('each CSP mode yields one consistent document policy', () => {
  const reportOnly = documentHeaders('report-only');
  assert.equal(reportOnly['Content-Security-Policy'], FRAMING_POLICY);
  assert.equal(reportOnly['Content-Security-Policy-Report-Only'], CONTENT_SECURITY_POLICY);
  const enforced = documentHeaders('enforce');
  assert.equal(enforced['Content-Security-Policy'], CONTENT_SECURITY_POLICY);
  assert.equal(enforced['Content-Security-Policy-Report-Only'], undefined);
  for (const directive of FRAMING_POLICY.split('; ')) assert.ok(CONTENT_SECURITY_POLICY.includes(directive), directive);
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /unsafe-eval|script-src[^;]*unsafe-inline|\s\*(;|$)/);
});

test('Notes documents and the Notes 404 receive the public document policy', async () => {
  for (const path of ['/notes/reachable-is-not-current', '/notes/not-a-real-note']) {
    const response = await worker.fetch(new Request(`https://hakan.run${path}`), assets(() => html()), {});
    for (const [name, value] of Object.entries({ ...COMMON_HEADERS, ...documentHeaders() })) {
      assert.equal(response.headers.get(name), value, `${path} ${name}`);
    }
  }
});

test('API JSON keeps its semantics and receives only the common headers', async () => {
  const response = await worker.fetch(new Request('https://hakan.run/api/unknown'), {}, {});
  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type'), /application\/json/);
  for (const [name, value] of Object.entries(COMMON_HEADERS)) assert.equal(response.headers.get(name), value, name);
  assert.equal(response.headers.get('x-frame-options'), null);
  assert.deepEqual(cspValues(response), []);
});

test('the Boss content preview keeps its own same-origin framing policy', () => {
  for (const mode of ['report-only', 'enforce']) {
    const response = withSecurityHeaders(new Request('https://hakan.run/boss/content/preview'), html('<div></div>', previewHeaders), mode);
    assert.equal(response.headers.get('content-security-policy'), PREVIEW_CSP);
    assert.match(PREVIEW_CSP, /frame-ancestors 'self'/);
    assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(response.headers.get('content-security-policy-report-only'), null);
    assert.equal(response.headers.get('strict-transport-security'), HSTS);
  }
});

test('a document never carries two contradictory enforced policies', () => {
  for (const mode of ['report-only', 'enforce']) {
    const response = withSecurityHeaders(new Request('https://hakan.run/'), html(), mode);
    assert.equal(response.headers.get('content-security-policy').split(',').length, 1);
    assert.equal(cspValues(response).length, mode === 'enforce' ? 1 : 2);
  }
});
