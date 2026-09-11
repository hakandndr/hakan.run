import React, { useLayoutEffect } from 'react';

export const SCROLL_POSITION_KEY = '__hakanRunScroll';

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

// Native reload restoration is disabled in index.html before the document body
// exists. This coordinator is therefore the sole restoration authority. It is
// mounted only after the published snapshot is READY and the full document has
// committed, so the loading shell's transient zero can never overwrite a
// stable history-entry position.
const ScrollManager = ({ navigationType, location }) => {
  useLayoutEffect(() => {
    if (navigationType === 'POP') {
      const saved = readScrollPosition(window.history.state);
      if (saved) {
        window.scrollTo({ top: saved.y, left: saved.x, behavior: 'auto' });
      }
    } else {
      const behavior = location.state?.scrollBehavior === 'smooth' ? 'smooth' : 'auto';
      const target = location.hash
        ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
        : null;

      if (target) target.scrollIntoView({ behavior });
      else if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior });
    }

    const entryKey = location.key;
    const persist = () => {
      // History changes before React cleans up the previous route effect. A
      // layout-driven scroll event from that transition must not overwrite the
      // destination entry with the previous route's coordinates.
      const currentEntryKey = window.history.state?.key ?? 'default';
      if (currentEntryKey !== entryKey) return;

      writeScrollPosition(window.history, {
        x: Math.max(0, window.scrollX),
        y: Math.max(0, window.scrollY),
      });
    };

    // A new SPA entry needs an initial checkpoint even when top-to-top scrolling
    // emits no event. POP keeps its saved value untouched until a later document
    // scroll occurs.
    if (navigationType !== 'POP') persist();
    window.addEventListener('scroll', persist, { passive: true });
    return () => window.removeEventListener('scroll', persist);
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
