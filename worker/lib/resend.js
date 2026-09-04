// Resend delivery.
//
// Delivery only. A submission is a durable record in APP_DB before this module
// is ever called, and nothing here can invalidate that record. The result is
// reported back so it can be stored against the submission.

export const sendNotification = async (env, { subject, text }) => {
  if (env.NOTIFICATIONS_ENABLED !== 'true') return { state: 'disabled' };
  if (!env.RESEND_API_KEY || !env.NOTIFICATION_SENDER || !env.NOTIFICATION_RECIPIENT) {
    return { state: 'failed', error: 'notifications_not_configured' };
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.NOTIFICATION_SENDER,
        to: [env.NOTIFICATION_RECIPIENT],
        subject,
        text,
      }),
    });
    if (!response.ok) {
      return { state: 'failed', error: `provider_status_${response.status}` };
    }
    return { state: 'sent' };
  } catch {
    return { state: 'failed', error: 'provider_unreachable' };
  }
};
