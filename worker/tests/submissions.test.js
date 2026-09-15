// The submission contract: persist durably, then acknowledge, then notify.

import test from 'node:test';
import assert from 'node:assert/strict';
import { handleSubmission } from '../public/submissions.js';
import { handleBossApi } from '../boss/index.js';
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

const submissionRequest = (body, { headers = {}, cf } = {}) => {
  const request = new Request('https://staging.hakan.run/api/contact', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'CF-Connecting-IP': '203.0.113.5',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  if (cf !== undefined) Object.defineProperty(request, 'cf', { value: cf });
  return request;
};

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
  TURNSTILE_EXPECTED_HOSTNAME: 'staging.hakan.run',
  NOTIFICATIONS_ENABLED: 'false',
  ...overrides,
});

test('a submission is stored before it is acknowledged', async (t) => {
  const db = openAppDb();
  global.fetch = async () => new Response(JSON.stringify({
    success: true,
    action: 'contact',
    hostname: 'staging.hakan.run',
  }), { status: 200 });
  t.after(() => { delete global.fetch; });

  const response = await handleSubmission(submissionRequest(valid), envWith(db), null);
  assert.equal(response.status, 202);

  const stored = db.prepare('SELECT * FROM submissions').all();
  assert.equal(stored.length, 1);
  assert.equal(stored[0].name, 'Test Person');
  assert.equal(stored[0].status, 'new');
});

test('Cloudflare request metadata is stored in APP_DB without trusting forwarded headers', async (t) => {
  const db = openAppDb();
  global.fetch = async () => new Response(JSON.stringify({
    success: true,
    action: 'contact',
    hostname: 'staging.hakan.run',
  }), { status: 200 });
  t.after(() => { delete global.fetch; });

  const request = submissionRequest(valid, {
    headers: {
      'CF-Connecting-IP': '203.0.113.9',
      'X-Forwarded-For': '198.51.100.200',
      'CF-Ray': 'ray-network-1',
      'user-agent': 'Metadata Browser',
    },
    cf: {
      country: 'US',
      region: 'California',
      regionCode: 'CA',
      city: 'Los Angeles',
      continent: 'NA',
      colo: 'LAX',
      asn: 64500,
      asOrganization: 'Example Network',
      httpProtocol: 'HTTP/3',
      tlsVersion: 'TLSv1.3',
    },
  });

  const response = await handleSubmission(request, envWith(db, {
    ANALYTICS_DB: new Proxy({}, {
      get() { throw new Error('submission metadata must never touch ANALYTICS_DB'); },
    }),
  }), null);
  assert.equal(response.status, 202);

  const stored = db.prepare('SELECT * FROM submissions').get();
  assert.equal(stored.source_ip, '203.0.113.9');
  assert.notEqual(stored.source_ip, '198.51.100.200');
  assert.equal(stored.country, 'US');
  assert.equal(stored.cf_region, 'California');
  assert.equal(stored.cf_region_code, 'CA');
  assert.equal(stored.cf_city, 'Los Angeles');
  assert.equal(stored.cf_continent, 'NA');
  assert.equal(stored.cf_colo, 'LAX');
  assert.equal(stored.cf_asn, 64500);
  assert.equal(stored.cf_as_organization, 'Example Network');
  assert.equal(stored.http_protocol, 'HTTP/3');
  assert.equal(stored.tls_version, 'TLSv1.3');
  assert.equal(stored.request_id, 'ray-network-1');
  assert.equal(stored.user_agent, 'Metadata Browser');
});

test('missing optional Cloudflare metadata never rejects a valid submission', async (t) => {
  const db = openAppDb();
  global.fetch = async () => new Response(JSON.stringify({
    success: true,
    action: 'contact',
    hostname: 'staging.hakan.run',
  }), { status: 200 });
  t.after(() => { delete global.fetch; });

  const response = await handleSubmission(
    submissionRequest(valid, { headers: { 'CF-Connecting-IP': '' } }),
    envWith(db),
    null,
  );
  assert.equal(response.status, 202);
  const stored = db.prepare('SELECT * FROM submissions').get();
  assert.equal(stored.source_ip, null);
  assert.equal(stored.cf_region, null);
  assert.equal(stored.cf_city, null);
  assert.equal(stored.cf_asn, null);
  assert.equal(stored.http_protocol, null);
  assert.equal(stored.tls_version, null);
});

test('a failed notification never invalidates the stored submission', async (t) => {
  const db = openAppDb();
  let call = 0;
  global.fetch = async () => {
    call += 1;
    // First call is Turnstile and succeeds; the notification provider then fails.
    if (call === 1) return new Response(JSON.stringify({
      success: true,
      action: 'contact',
      hostname: 'staging.hakan.run',
    }), { status: 200 });
    return new Response(JSON.stringify({ name: 'provider_error', message: 'provider down' }), {
      status: 500,
      headers: { 'content-type': 'application/json', 'x-request-id': 'request_failed_1' },
    });
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
  assert.equal(stored[0].notification_provider, 'resend');
  assert.ok(stored[0].notification_attempted_at > 0);
  assert.equal(stored[0].notification_provider_status, 500);
  assert.equal(stored[0].notification_request_id, 'request_failed_1');
  assert.equal(stored[0].notification_error, 'provider_status_500: provider_error: provider down');
});

test('a successful owner notification records the provider request id', async (t) => {
  const db = openAppDb();
  let call = 0;
  let providerRequest = null;
  global.fetch = async (_url, init) => {
    call += 1;
    if (call === 1) {
      return new Response(JSON.stringify({
        success: true,
        action: 'contact',
        hostname: 'staging.hakan.run',
      }), { status: 200 });
    }
    assert.equal(
      db.prepare('SELECT COUNT(*) AS value FROM submissions').get().value,
      1,
      'the durable submission must exist before provider delivery begins',
    );
    providerRequest = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'email_123' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
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

  assert.equal(response.status, 202);
  assert.deepEqual(providerRequest.to, ['hakan@dndr.net']);
  assert.equal(providerRequest.reply_to, 'test@example.com');
  assert.match(providerRequest.text, /Received \(PT\):/);
  assert.match(providerRequest.text, /Source: \/contact/);
  assert.match(providerRequest.text, /Hello/);
  const stored = db.prepare('SELECT * FROM submissions').get();
  assert.equal(stored.notification_state, 'sent');
  assert.equal(stored.notification_attempts, 1);
  assert.equal(stored.notification_provider, 'resend');
  assert.equal(stored.notification_provider_status, 200);
  assert.equal(stored.notification_request_id, 'email_123');
  assert.ok(stored.notification_attempted_at > 0);
  assert.ok(stored.notified_at > 0);
});

test('disabled delivery is explicit and is not counted as a provider attempt', async (t) => {
  const db = openAppDb();
  global.fetch = async () => new Response(JSON.stringify({
    success: true,
    action: 'contact',
    hostname: 'staging.hakan.run',
  }), { status: 200 });
  t.after(() => { delete global.fetch; });

  await handleSubmission(submissionRequest(valid), envWith(db), null);
  const stored = db.prepare('SELECT * FROM submissions').get();
  assert.equal(stored.notification_state, 'disabled');
  assert.equal(stored.notification_attempts, 0);
  assert.equal(stored.notification_provider, 'resend');
  assert.equal(stored.notification_attempted_at, null);
  assert.equal(stored.notification_provider_status, null);
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

test('Turnstile must return the contact action and the exact environment hostname', async (t) => {
  const db = openAppDb();
  for (const challenge of [
    { success: true, action: 'login', hostname: 'staging.hakan.run' },
    { success: true, action: 'contact', hostname: 'hakan.run' },
  ]) {
    global.fetch = async () => new Response(JSON.stringify(challenge), { status: 200 });
    const response = await handleSubmission(submissionRequest(valid), envWith(db), null);
    assert.equal(response.status, 403);
  }
  t.after(() => { delete global.fetch; });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM submissions').get().n, 0);
});

test('oversized and non-string Turnstile tokens are rejected before Siteverify', async () => {
  const db = openAppDb();
  let called = false;
  global.fetch = async () => { called = true; throw new Error('must not be called'); };
  try {
    for (const token of ['x'.repeat(2049), { token: 'x' }]) {
      const response = await handleSubmission(
        submissionRequest({ ...valid, turnstileToken: token }),
        envWith(db),
        null,
      );
      assert.equal(response.status, 403);
    }
  } finally {
    delete global.fetch;
  }
  assert.equal(called, false);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM submissions').get().n, 0);
});

test('Boss list stays compact and detail exposes stored operational metadata', async () => {
  const db = openAppDb();
  db.prepare(
    `INSERT INTO submissions
      (id, received_at, name, email, message, source_path, country, user_agent,
       notification_state, notification_attempts, notification_provider,
       notification_attempted_at, notification_provider_status,
       notification_request_id, notified_at, request_id, source_ip, cf_region,
       cf_region_code, cf_city, cf_continent, cf_colo, cf_asn,
       cf_as_organization, http_protocol, tls_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    'submission-1', 1_700_000_000_000, 'Owner Test', 'sender@example.com', 'Stored message',
    '/contact', 'US', 'Browser UA', 'sent', 1, 'resend', 1_700_000_000_250, 200, 'email_123',
    1_700_000_000_500, 'cf-ray-1', '203.0.113.9', 'California', 'CA',
    'Los Angeles', 'NA', 'LAX', 64500, 'Example Network', 'HTTP/3', 'TLSv1.3',
  );
  const response = await handleBossApi(
    new Request('https://staging.hakan.run/api/boss/submissions'),
    { APP_DB: d1(db) },
    {},
    { email: 'hakan@dndr.net' },
  );
  const body = await response.json();
  assert.deepEqual(Object.keys(body.submissions[0]).sort(), [
    'email', 'id', 'name', 'notification_state', 'received_at', 'status',
  ]);

  const detailResponse = await handleBossApi(
    new Request('https://staging.hakan.run/api/boss/submissions/submission-1'),
    { APP_DB: d1(db) },
    {},
    { email: 'hakan@dndr.net' },
  );
  const detail = (await detailResponse.json()).submission;
  assert.equal(detail.message, 'Stored message');
  assert.equal(detail.user_agent, 'Browser UA');
  assert.equal(detail.request_id, 'cf-ray-1');
  assert.equal(detail.source_ip, '203.0.113.9');
  assert.equal(detail.cf_region, 'California');
  assert.equal(detail.cf_region_code, 'CA');
  assert.equal(detail.cf_city, 'Los Angeles');
  assert.equal(detail.cf_continent, 'NA');
  assert.equal(detail.cf_colo, 'LAX');
  assert.equal(detail.cf_asn, 64500);
  assert.equal(detail.cf_as_organization, 'Example Network');
  assert.equal(detail.http_protocol, 'HTTP/3');
  assert.equal(detail.tls_version, 'TLSv1.3');
  assert.equal(detail.notification_provider, 'resend');
  assert.equal(detail.notification_attempted_at, 1_700_000_000_250);
  assert.equal(detail.notification_provider_status, 200);
  assert.equal(detail.notification_request_id, 'email_123');
});

test('Boss detail preserves NULL request metadata for historical submissions', async () => {
  const db = openAppDb();
  db.prepare(
    `INSERT INTO submissions
      (id, received_at, name, email, message, source_path, notification_state)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run('historical-1', 1, 'Historical', 'historical@example.com', 'Old row', '/contact', 'stored');

  const response = await handleBossApi(
    new Request('https://staging.hakan.run/api/boss/submissions/historical-1'),
    { APP_DB: d1(db) },
    {},
    { email: 'hakan@dndr.net' },
  );
  const detail = (await response.json()).submission;
  for (const field of [
    'source_ip', 'cf_region', 'cf_region_code', 'cf_city', 'cf_continent',
    'cf_colo', 'cf_asn', 'cf_as_organization', 'http_protocol', 'tls_version',
  ]) {
    assert.equal(detail[field], null, `${field} remains unavailable rather than invented`);
  }
});
