import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useContent } from '@/contexts/ContentContext';

// Explicit same-page refresh scroll restoration.
//
// Native browser restoration is unreliable here: it can run before React has
// mounted and before the client-rendered document has any usable height, so
// the page reopens at the top. `history.scrollRestoration` is therefore set to
// 'manual' at boot and the position is managed here instead.
//
// The position is saved per pathname when the page is being unloaded, and it
// is re-applied only on the initial load of that same pathname. In-app route
// changes never restore; they still reset to the top.

const STORAGE_KEY = 'scrollPositions';

// Applying the position while the readiness gate still hides the content keeps
// the restore invisible; the loop keeps re-asserting until the content is
// visible and the position holds, which absorbs late layout growth.
const RESTORE_TIMEOUT_MS = 3000;
const CANCEL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];

const readPositions = () => {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const savePosition = (pathname) => {
  try {
    const positions = readPositions();
    positions[pathname] = Math.round(window.scrollY);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    /* storage unavailable — restoration is a progressive enhancement */
  }
};

const ScrollRestoration = () => {
  const { pathname } = useLocation();
  const { contentReady } = useContent();

  const pathnameRef = useRef(pathname);
  const contentReadyRef = useRef(contentReady);
  const initialPathname = useRef(pathname);
  const sawInitialRender = useRef(false);
  const restoreDone = useRef(false);

  pathnameRef.current = pathname;
  contentReadyRef.current = contentReady;

  // Persist the position of whatever page is on screen when it goes away.
  useEffect(() => {
    const save = () => savePosition(pathnameRef.current);
    const saveWhenHidden = () => {
      if (document.visibilityState === 'hidden') save();
    };

    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', saveWhenHidden);

    return () => {
      window.removeEventListener('pagehide', save);
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', saveWhenHidden);
    };
  }, []);

  // Restore once, for the initial load only, and only for the same pathname.
  useEffect(() => {
    const target = readPositions()[initialPathname.current];
    if (typeof target !== 'number' || target <= 0) {
      restoreDone.current = true;
      return undefined;
    }

    const deadline = Date.now() + RESTORE_TIMEOUT_MS;
    let frame = null;

    const stop = () => {
      restoreDone.current = true;
      if (frame !== null) cancelAnimationFrame(frame);
      CANCEL_EVENTS.forEach(name => window.removeEventListener(name, stop));
    };

    // A deliberate scroll by the visitor always wins over restoration.
    CANCEL_EVENTS.forEach(name => window.addEventListener(name, stop, { passive: true }));

    const step = () => {
      if (restoreDone.current || Date.now() > deadline) {
        stop();
        return;
      }

      // Clamp to what the document can currently reach, so a page that is
      // shorter than it was still lands as close as possible instead of at the
      // top, and keep re-applying while late layout growth extends the page.
      const reachable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const desired = Math.min(target, reachable);
      if (Math.round(window.scrollY) !== desired) window.scrollTo(0, desired);

      // Settle only once the content is actually on screen at the full target.
      if (contentReadyRef.current && desired === target && Math.round(window.scrollY) === target) {
        stop();
        return;
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return stop;
  }, []);

  // In-app route changes reset to the top and disable any pending restoration.
  useEffect(() => {
    if (!sawInitialRender.current) {
      sawInitialRender.current = true;
      return;
    }

    restoreDone.current = true;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollRestoration;
