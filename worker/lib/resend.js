// Resend delivery.
//
// Delivery only. A submission is a durable record in APP_DB before this module
// is ever called, and nothing here can invalidate that record. The result is
// reported back so it can be stored against the submission.

const providerError = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // The HTTP status remains sufficient when the provider body is not JSON.
  }
  const detail = [payload?.name ?? payload?.code, payload?.message]
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim().replace(/\s+/g, ' '))
    .join(': ');
  return `${`provider_status_${response.status}`}${detail ? `: ${detail}` : ''}`.slice(0, 512);
};

export const sendNotification = async (env, { subject, text, replyTo }) => {
  if (env.NOTIFICATIONS_ENABLED !== 'true') {
    return { state: 'disabled', provider: 'resend', attempted: false };
  }
  if (!env.RESEND_API_KEY || !env.NOTIFICATION_SENDER || !env.NOTIFICATION_RECIPIENT) {
    return {
      state: 'failed',
      provider: 'resend',
      attempted: false,
      error: 'notifications_not_configured',
    };
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
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        text,
      }),
    });
    if (!response.ok) {
      return {
        state: 'failed',
        provider: 'resend',
        attempted: true,
        providerStatus: response.status,
        requestId: response.headers.get('x-request-id') || null,
        error: await providerError(response),
      };
    }
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // A successful provider response without JSON still means delivery was accepted.
    }
    return {
      state: 'sent',
      provider: 'resend',
      attempted: true,
      providerStatus: response.status,
      requestId: typeof payload?.id === 'string'
        ? payload.id.slice(0, 255)
        : response.headers.get('x-request-id') || null,
    };
  } catch {
    return {
      state: 'failed',
      provider: 'resend',
      attempted: true,
      error: 'provider_unreachable',
    };
  }
};
