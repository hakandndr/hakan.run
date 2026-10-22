import React, { useLayoutEffect } from 'react';
import { prefersReducedMotion, resolveScrollBehavior } from '@/router/scroll-behavior';

export const SCROLL_POSITION_KEY = '__hakanRunScroll';

const sessionScrollPositions = new Map();

// The history entry this coordinator currently manages; null until it mounts,
// so nothing is recorded for the loading shell.
let managedEntryKey = null;

const finitePosition = (value) =>
  Number.isFinite(value) && value >= 0 ? value : null;

export const readScrollPosition = (state) => {
  const position = state?.[SCROLL_POSITION_KEY];
  const x = finitePosition(position?.x);
  const y = finitePosition(position?.y);
  return x === null || y === null ? null : { x, y };
};

export const writeScrollPosition = (history, position) => {
  const current = history.state && typeof history.state === 'object'
    ? history.state
    : {};
  history.replaceState({
    ...current,
    [SCROLL_POSITION_KEY]: position,
  }, '');
};

const currentScrollPosition = () => ({
  x: Math.max(0, window.scrollX),
  y: Math.max(0, window.scrollY),
});

const rememberScrollPosition = (entryKey) => {
  const position = currentScrollPosition();
  sessionScrollPositions.set(entryKey, position);
  return position;
};

/**
 * Record the managed entry's position at the moment it is left. The router
 * calls this from its history listener, before the next route commits, while
 * the document still shows the entry being left. Scroll events arrive up to a
 * frame late, and one that arrives after the history entry changed belongs to
 * the new entry, so a navigation in the same frame as the last scroll movement
 * would otherwise leave the previous entry with an older position.
 */
export const recordScrollDeparture = () => {
  if (managedEntryKey !== null) rememberScrollPosition(managedEntryKey);
};

// Native reload restoration is disabled in index.html before the document body
// exists. This coordinator is therefore the sole restoration authority. It is
// mounted only after the published snapshot is READY and the full document has
// committed, so the loading shell's transient zero can never overwrite a
// stable history-entry position.
const ScrollManager = ({ navigationType, location }) => {
  useLayoutEffect(() => {
    if (navigationType === 'POP') {
      const saved = sessionScrollPositions.get(location.key)
        ?? readScrollPosition(window.history.state);
      if (saved) {
        window.scrollTo({ top: saved.y, left: saved.x, behavior: 'auto' });
      }
    } else {
      const behavior = resolveScrollBehavior(location.state?.scrollBehavior, prefersReducedMotion());
      const target = location.hash
        ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
        : null;

      if (target) target.scrollIntoView({ behavior });
      else if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior });
    }

    const entryKey = location.key;
    managedEntryKey = entryKey;
    const remember = () => {
      const currentEntryKey = window.history.state?.key ?? 'default';
      if (currentEntryKey !== entryKey) return null;
      return rememberScrollPosition(entryKey);
    };
    const persist = () => {
      const position = remember();
      if (position) writeScrollPosition(window.history, position);
    };

    // A new SPA entry needs an initial checkpoint even when top-to-top scrolling
    // emits no event. Scroll events update the in-memory entry continuously, but
    // the History API is touched only at stable boundaries. This avoids exhausting
    // browser pushState/replaceState frequency limits during smooth scrolling.
    if (navigationType !== 'POP') persist();
    window.addEventListener('scroll', remember, { passive: true });
    window.addEventListener('scrollend', persist, { passive: true });
    window.addEventListener('pagehide', persist);
    return () => {
      if (managedEntryKey === entryKey) managedEntryKey = null;
      window.removeEventListener('scroll', remember);
      window.removeEventListener('scrollend', persist);
      window.removeEventListener('pagehide', persist);
    };
  }, [
    location.hash,
    location.key,
    location.pathname,
    location.search,
    location.state?.scrollBehavior,
    navigationType,
  ]);

  return null;
};

export default ScrollManager;
