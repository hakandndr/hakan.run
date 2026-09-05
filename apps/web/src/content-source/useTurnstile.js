// The Turnstile widget, loaded from the environment's own site key.
//
// The Worker fails closed: a submission with no token is refused with 403, and a
// Worker with no secret refuses every submission. So the widget is not optional
// decoration on this form — it is the only way a visitor can be served — and the
// interesting states are the ones where it cannot be shown.
//
// Those states are surfaced rather than hidden. A form whose challenge never
// loaded still renders, but it says why it cannot be sent instead of offering a
// button that will always fail.

import { useEffect, useRef, useState } from 'react';
import { loadPublicConfig } from './contact.js';

export const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const TURNSTILE_STATE = {
  loading: 'loading',
  ready: 'ready',
  solved: 'solved',
  unavailable: 'unavailable',
};

const loadScript = () =>
  new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('no document'));
    if (window.turnstile) return resolve(window.turnstile);

    const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve(window.turnstile), { once: true });
    script.addEventListener('error', () => reject(new Error('turnstile script failed')), { once: true });
    if (!existing) {
      script.src = TURNSTILE_SCRIPT;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    return undefined;
  });

/**
 * Render a Turnstile widget into `containerRef` and hand back its token.
 *
 * Returns `{ state, token, reason, reset }`. `state` is what the form renders
 * from; `reason` explains an `unavailable` so a misconfigured environment is
 * diagnosable from the page rather than only from the Worker's logs.
 */
export const useTurnstile = (containerRef) => {
  const [state, setState] = useState(TURNSTILE_STATE.loading);
  const [token, setToken] = useState(null);
  const [reason, setReason] = useState(null);
  const widgetId = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const config = await loadPublicConfig();
      if (cancelled) return;

      if (!config.turnstileSiteKey) {
        setState(TURNSTILE_STATE.unavailable);
        setReason(config.reason ?? 'not_configured');
        return;
      }

      let turnstile;
      try {
        turnstile = await loadScript();
      } catch {
        if (!cancelled) {
          setState(TURNSTILE_STATE.unavailable);
          setReason('script_blocked');
        }
        return;
      }
      if (cancelled || !turnstile || !containerRef.current) return;

      try {
        widgetId.current = turnstile.render(containerRef.current, {
          sitekey: config.turnstileSiteKey,
          theme: 'dark',
          callback: (value) => { setToken(value); setState(TURNSTILE_STATE.solved); },
          'expired-callback': () => { setToken(null); setState(TURNSTILE_STATE.ready); },
          'error-callback': () => { setToken(null); setState(TURNSTILE_STATE.unavailable); setReason('challenge_error'); },
        });
        setState(TURNSTILE_STATE.ready);
      } catch {
        setState(TURNSTILE_STATE.unavailable);
        setReason('render_failed');
      }
    })();

    return () => { cancelled = true; };
  }, [containerRef]);

  // After a submission the token is spent; Turnstile issues one per solve.
  const reset = () => {
    setToken(null);
    if (window.turnstile && widgetId.current !== null) {
      try {
        window.turnstile.reset(widgetId.current);
        setState(TURNSTILE_STATE.ready);
      } catch {
        /* a widget that will not reset is reported by the next submission */
      }
    }
  };

  return { state, token, reason, reset };
};
