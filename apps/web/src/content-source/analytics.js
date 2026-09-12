export const normalizePagePath = (pathname) => {
  if (typeof pathname !== 'string') return null;
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/' || path === '/card' || path === '/contact') return path;

  if (/^\/project\/[^/]+$/.test(path)) {
    return path;
  }

  return null;
};

export const shouldTrackPage = (hostname, pathname) =>
  hostname === 'staging.hakan.run' &&
  normalizePagePath(pathname) !== null;

let lastPath = null;

export const recordPageView = (pathname, options = {}) => {
  const hostname = options.hostname ?? window.location.hostname;
  const path = normalizePagePath(pathname);

  if (!shouldTrackPage(hostname, pathname)) {
    lastPath = null;
    return false;
  }

  // Suppress duplicate effects/remounts for the same route.
  // A genuine route change is still recorded.
  if (lastPath === path) return false;
  lastPath = path;

  let sessionId = null;
  try {
    sessionId = sessionStorage.getItem('hakan.analytics.session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('hakan.analytics.session', sessionId);
    }
  } catch {
    sessionId = crypto.randomUUID();
  }

  const payload = {
    path,
    referrer: document.referrer || null,
    sessionId,
  };

  fetch('/api/analytics/page', {
    method: 'POST',
    credentials: 'omit',
    cache: 'no-store',
    keepalive: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((response) => {
    if (!response.ok) {
      console.warn('[Analytics] PAGE event rejected:', response.status);
    }
  }).catch((error) => {
    console.warn('[Analytics] PAGE event failed:', error);
  });

  return true;
};
