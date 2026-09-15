// Cloudflare Email Sending delivery.
//
// Delivery only. A submission is durable in APP_DB before this module is ever
// called. The native Worker binding needs no REST token, and the Wrangler
// binding independently restricts both the sender and destination addresses.

const PROVIDER = 'cloudflare_email';

const errorDetail = (error) => {
  const detail = [error?.code, error?.message]
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim().replace(/\s+/g, ' '))
    .join(': ');
  return (detail || 'email_send_failed').slice(0, 512);
};

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export const sendNotification = async (env, { subject, text, replyTo }) => {
  if (env.NOTIFICATIONS_ENABLED !== 'true') {
    return { state: 'disabled', provider: PROVIDER, attempted: false };
  }
  if (!env.EMAIL?.send || !env.NOTIFICATION_SENDER || !env.NOTIFICATION_RECIPIENT) {
    return {
      state: 'failed',
      provider: PROVIDER,
      attempted: false,
      error: 'notifications_not_configured',
    };
  }

  try {
    const result = await env.EMAIL.send({
      from: { email: env.NOTIFICATION_SENDER, name: 'hakan.run' },
      to: env.NOTIFICATION_RECIPIENT,
      ...(replyTo ? { replyTo } : {}),
      subject,
      text,
      html: `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${escapeHtml(text)}</pre>`,
    });
    return {
      state: 'sent',
      provider: PROVIDER,
      attempted: true,
      requestId: typeof result?.messageId === 'string'
        ? result.messageId.slice(0, 255)
        : null,
    };
  } catch (error) {
    return {
      state: 'failed',
      provider: PROVIDER,
      attempted: true,
      error: errorDetail(error),
    };
  }
};
