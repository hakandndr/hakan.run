// The scroll behavior a navigation actually uses.
//
// Navigation records the intent (`smooth` for in-page section links, `auto`
// otherwise) in history state; ScrollManager turns it into a scroll. An
// explicit `behavior: 'smooth'` passed to scrollIntoView/scrollTo is not
// governed by the CSS `scroll-behavior` property, so the reduced-motion rule in
// index.css cannot stop it. The user's motion preference is therefore applied
// here, at the one place that performs the scroll.

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Pure: resolve the requested behavior against the user's motion preference. */
export const resolveScrollBehavior = (requested, prefersReducedMotion) =>
  requested === 'smooth' && !prefersReducedMotion ? 'smooth' : 'auto';

/** The current motion preference of this browser window. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia(REDUCED_MOTION_QUERY).matches;
