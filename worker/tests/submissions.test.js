// The submission contract: persist durably, then acknowledge, then notify.

import test from 'node:test';
import assert from 'node:assert/strict';
import { handleSubmission } from '../public/submissions.js';
import { openAppDb } from './helpers.js';

// A minimal D1-shaped adapter over SQLite, so the handler under test is the
// real one rather than a stand-in.
const d1 = (db) => ({
  prepare(sql) {
    return {
      bind(...params) {
        return {
          run: async () => db.prepare(sql).run(...params),
          first: async () => db.prepare(sql).get(...params) ?? null,
          all: async () => ({ results: db.prepare(sql).all(...params) }),
        };
      },
    };
  },
});

const submissionRequest = (body) =>
  new Request('https://staging.hakan.run/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.5' },
    body: JSON.stringify(body),
  });

const valid = {
  name: 'Test Person',
  email: 'test@example.com',
  message: 'Hello',
  turnstileToken: 'token',
  sourcePath: '/contact',
};

const envWith = (db, overrides = {}) => ({
  APP_DB: d1(db),
  TURNSTILE_SECRET_KEY: 'secret',
  NOTIFICATIONS_ENABLED: 'false',
  ...overrides,
});

test('a submission is stored before it is acknowledged', async (t) => {
  const db = openAppDb();
  global.fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 });
  t.after(() => { delete global.fetch; });

  const response = await handleSubmission(submissionRequest(valid), envWith(db), null);
  assert.equal(response.status, 202);

  const stored = db.prepare('SELECT * FROM submissions').all();
  assert.equal(stored.length, 1);
  assert.equal(stored[0].name, 'Test Person');
  assert.equal(stored[0].status, 'new');
});

test('a failed notification never invalidates the stored submission', async (t) => {
  const db = openAppDb();
  let call = 0;
  global.fetch = async () => {
    call += 1;
    // First call is Turnstile and succeeds; the notification provider then fails.
    if (call === 1) return new Response(JSON.stringify({ success: true }), { status: 200 });
    return new Response('provider down', { status: 500 });
  };
  t.after(() => { delete global.fetch; });

  const response = await handleSubmission(
    submissionRequest(valid),
    envWith(db, {
      NOTIFICATIONS_ENABLED: 'true',
      RESEND_API_KEY: 'key',
      NOTIFICATION_SENDER: 'noreply@hakan.run',
      NOTIFICATION_RECIPIENT: 'hakan@dndr.net',
    }),
    null,
  );

  assert.equal(response.status, 202, 'the submission is still accepted');
  const stored = db.prepare('SELECT * FROM submissions').all();
  assert.equal(stored.length, 1, 'the row survives a notification failure');
  assert.equal(stored[0].notification_state, 'failed');
  assert.equal(stored[0].notification_attempts, 1);
});

test('a failed challenge stores nothing at all', async (t) => {
  const db = openAppDb();
  global.fetch = async () => new Response(JSON.stringify({ success: false }), { status: 200 });
  t.after(() => { delete global.fetch; });

  const response = await handleSubmission(submissionRequest(valid), envWith(db), null);
  assert.equal(response.status, 403);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM submissions').get().n, 0);
});

test('a missing Turnstile secret denies rather than skipping verification', async () => {
  const db = openAppDb();
  const response = await handleSubmission(
    submissionRequest(valid),
    { APP_DB: d1(db), NOTIFICATIONS_ENABLED: 'false' },
    null,
  );
  assert.equal(response.status, 403);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM submissions').get().n, 0);
});

test('invalid input is rejected before any challenge or write', async () => {
  const db = openAppDb();
  const response = await handleSubmission(
    submissionRequest({ ...valid, email: 'not-an-email' }),
    envWith(db),
    null,
  );
  assert.equal(response.status, 400);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM submissions').get().n, 0);
});
