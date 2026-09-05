// The contact submission path: what each Worker answer means, and what the
// bundle is no longer allowed to contain.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTACT_ENDPOINT,
  CONFIG_ENDPOINT,
  CONTACT_RESULT,
  interpretContactResponse,
  submissionBody,
  loadPublicConfig,
  submitContact,
} from './contact.js';

const response = ({ ok = true, status = 202, payload = { id: 'x', status: 'stored' }, json = true } = {}) => ({
  ok,
  status,
  json: async () => {
    if (!json) throw new SyntaxError('not json');
    return payload;
  },
});

// --- Outcomes ---------------------------------------------------------------

test('202 stored is success — the Worker acknowledges a write, not a delivery', () => {
  const result = interpretContactResponse({ ok: true, status: 202, payload: { id: 'abc', status: 'stored' } });
  assert.equal(result.result, CONTACT_RESULT.stored);
  assert.equal(result.id, 'abc');
});

test('a rejected challenge is its own outcome, not a generic failure', () => {
  assert.equal(
    interpretContactResponse({ ok: false, status: 403, payload: { error: 'challenge_failed' } }).result,
    CONTACT_RESULT.challenge,
  );
});

test('a validation refusal is distinguishable from a server failure', () => {
  assert.equal(interpretContactResponse({ ok: false, status: 400 }).result, CONTACT_RESULT.invalid);
  assert.equal(interpretContactResponse({ ok: false, status: 500 }).result, CONTACT_RESULT.failed);
});

test('a transport failure is a failure, never a silent success', async () => {
  const outcome = await submitContact({
    fields: { name: 'a', email: 'a@b.co', message: 'hi' },
    fetchImpl: async () => { throw new TypeError('Failed to fetch'); },
  });
  assert.equal(outcome.result, CONTACT_RESULT.failed);
});

test('a success with an unreadable body is still a success', async () => {
  // The write happened; a body we cannot parse does not un-happen it.
  const outcome = await submitContact({
    fields: { name: 'a', email: 'a@b.co', message: 'hi' },
    fetchImpl: async () => response({ json: false }),
  });
  assert.equal(outcome.result, CONTACT_RESULT.stored);
});

// --- Request shape ----------------------------------------------------------

test('the submission goes to the Worker, as JSON, with the challenge token', async () => {
  let seen;
  await submitContact({
    fields: { name: '  Hakan  ', email: ' hakan@dndr.net ', message: ' hello ' },
    turnstileToken: 'token-value',
    sourcePath: '/contact',
    fetchImpl: async (url, init) => { seen = { url, init }; return response(); },
  });

  assert.equal(seen.url, CONTACT_ENDPOINT);
  assert.equal(seen.init.method, 'POST');
  assert.match(seen.init.headers['content-type'], /application\/json/);
  assert.deepEqual(JSON.parse(seen.init.body), {
    name: 'Hakan',
    email: 'hakan@dndr.net',
    message: 'hello',
    turnstileToken: 'token-value',
    sourcePath: '/contact',
  });
});

test('the body matches the fields the Worker validates, and adds nothing', () => {
  const body = submissionBody({ name: 'a', email: 'b@c.de', message: 'm' }, 't', '');
  assert.deepEqual(Object.keys(body).sort(), ['email', 'message', 'name', 'sourcePath', 'turnstileToken']);
  assert.equal(body.sourcePath, '/contact', 'an empty source path falls back to the page, not to undefined');
});

test('a missing token is sent as null rather than omitted', () => {
  // The Worker refuses it either way; sending null keeps the refusal a
  // challenge failure rather than a body-shape failure.
  assert.equal(submissionBody({ name: 'a', email: 'b@c.de', message: 'm' }, undefined, '/contact').turnstileToken, null);
});

// --- Public configuration ---------------------------------------------------

test('the site key is read from the Worker, not from the build', async () => {
  let seen;
  const config = await loadPublicConfig(async (url) => {
    seen = url;
    return { ok: true, status: 200, json: async () => ({ contract: 1, turnstileSiteKey: 'site-key' }) };
  });
  assert.equal(seen, CONFIG_ENDPOINT);
  assert.equal(config.turnstileSiteKey, 'site-key');
});

test('an unavailable configuration is reported, never guessed', async () => {
  for (const [impl, reason] of [
    [async () => { throw new Error('offline'); }, 'transport'],
    [async () => ({ ok: false, status: 503, json: async () => ({}) }), 'http_503'],
    [async () => ({ ok: true, status: 200, json: async () => ({ contract: 1, turnstileSiteKey: null }) }), 'not_configured'],
    [async () => ({ ok: true, status: 200, json: async () => 'nope' }), 'malformed'],
  ]) {
    const config = await loadPublicConfig(impl);
    assert.equal(config.turnstileSiteKey, null);
    assert.equal(config.reason, reason);
  }
});

// --- The dependency that must not come back ---------------------------------

test('no source file posts to a third-party form endpoint', async () => {
  const { readFileSync, readdirSync, statSync } = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

  const files = (directory) =>
    readdirSync(directory).flatMap((entry) => {
      const full = path.join(directory, entry);
      if (statSync(full).isDirectory()) return files(full);
      return /\.(js|jsx)$/.test(entry) && !entry.endsWith('.test.js') ? [full] : [];
    });

  // Comments explain the history and name it; the question is what runs.
  const withoutComments = (contents) =>
    contents.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  const offenders = files(srcRoot)
    .filter((file) => /formspree/i.test(withoutComments(readFileSync(file, 'utf8'))))
    .map((file) => path.relative(srcRoot, file).split(path.sep).join('/'));

  assert.deepEqual(offenders, [], 'Submissions go to the Worker. No fallback endpoint may survive in the bundle.');
});

test('the fallback content no longer declares a form endpoint', async () => {
  const { siteContent } = await import('../content.js');
  assert.equal(siteContent.contact.formEndpoint, undefined);
});
