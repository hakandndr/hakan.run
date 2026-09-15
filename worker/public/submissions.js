// Public submission intake.
//
// The order is the product contract, not an implementation detail:
//
//   verify Turnstile -> validate -> persist durably -> acknowledge -> notify
//
// A 200 means the submission exists in APP_DB. Notification runs after the
// acknowledgement and its outcome is recorded against the stored row; a failed
// or disabled notification never invalidates, hides or rejects a submission.

import { json, problem } from '../lib/response.js';
import { verifyTurnstile } from '../lib/turnstile.js';
import { sendNotification } from '../lib/resend.js';
import { formatLocalInstant } from '../lib/time.js';

const MAX_FIELD = { name: 120, email: 200, message: 4000 };

const validate = (payload) => {
  if (typeof payload !== 'object' || payload === null) return null;
  const name = String(payload.name ?? '').trim();
  const email = String(payload.email ?? '').trim();
  const message = String(payload.message ?? '').trim();
  if (!name || name.length > MAX_FIELD.name) return null;
  if (!email || email.length > MAX_FIELD.email || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) return null;
  if (!message || message.length > MAX_FIELD.message) return null;
  return { name, email, message };
};

export const handleSubmission = async (request, env, context) => {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return problem('invalid_body', 400);
  }

  const fields = validate(payload);
  if (!fields) return problem('invalid_submission', 400);

  const challenge = await verifyTurnstile(
    payload.turnstileToken,
    env,
    request.headers.get('CF-Connecting-IP'),
  );
  if (!challenge.ok) return problem('challenge_failed', 403);

  const id = crypto.randomUUID();
  const receivedAt = Date.now();
  const requestId = request.headers.get('CF-Ray');
  const initialNotificationState = env.NOTIFICATIONS_ENABLED === 'true' ? 'pending' : 'disabled';

  // Durable first. If this throws, nothing is acknowledged and nothing is sent.
  await env.APP_DB.prepare(
    `INSERT INTO submissions
       (id, received_at, name, email, message, source_path, country, user_agent,
        notification_state, notification_provider, request_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      receivedAt,
      fields.name,
      fields.email,
      fields.message,
      String(payload.sourcePath ?? '/contact').slice(0, 512),
      request.cf?.country ?? null,
      (request.headers.get('user-agent') ?? '').slice(0, 512),
      initialNotificationState,
      'resend',
      requestId,
    )
    .run();

  // Acknowledged now; notification is strictly after the durable write.
  const notify = async () => {
    const result = await sendNotification(env, {
      subject: `hakan.run — new submission from ${fields.name}`,
      replyTo: fields.email,
      text: [
        `Name: ${fields.name}`,
        `Email: ${fields.email}`,
        `Received (PT): ${formatLocalInstant(receivedAt)}`,
        `Source: ${String(payload.sourcePath ?? '/contact').slice(0, 512)}`,
        requestId ? `Cloudflare request: ${requestId}` : null,
        '',
        fields.message,
      ].filter((line) => line !== null).join('\n'),
    });
    const attemptedAt = result.attempted ? Date.now() : null;
    await env.APP_DB.prepare(
      `UPDATE submissions
         SET notification_state = ?, notification_attempts = notification_attempts + ?,
             notification_error = ?, notified_at = ?, notification_provider = ?,
             notification_attempted_at = ?, notification_provider_status = ?,
             notification_request_id = ?
       WHERE id = ?`,
    )
      .bind(
        result.state,
        result.attempted ? 1 : 0,
        result.error ?? null,
        result.state === 'sent' ? Date.now() : null,
        result.provider ?? null,
        attemptedAt,
        result.providerStatus ?? null,
        result.requestId ?? null,
        id,
      )
      .run();
  };

  if (context?.waitUntil) context.waitUntil(notify());
  else await notify();

  return json({ id, status: 'stored' }, 202);
};
