export const isNotesPath = (pathname) => pathname === '/notes' || pathname.startsWith('/notes/');

const blendsWithNotes = (pathname) => pathname === '/' || isNotesPath(pathname);

// Pathname changes into, within and out of Engineering Notes (to the homepage)
// are committed inside a view transition. Hash-only changes keep the existing
// smooth scroll, and pages with their own entry motion are left alone.
export const shouldTransitionRoute = (from, to) => from !== to
  && blendsWithNotes(from)
  && blendsWithNotes(to)
  && (isNotesPath(from) || isNotesPath(to));

export const canStartViewTransition = (environment = globalThis) => {
  const { document, matchMedia } = environment;
  if (typeof document?.startViewTransition !== 'function') return false;
  return !matchMedia?.call(environment, '(prefers-reduced-motion: reduce)').matches;
};

// True only while a route change is being committed inside a view transition.
// Components that mount during that commit are already being blended in by the
// browser, so they can skip first-load entrance motion that would otherwise
// start from an invisible state and reintroduce a dark frame.
let transitionCommit = false;

export const commitInRouteTransition = (commit) => {
  transitionCommit = true;
  try {
    commit();
  } finally {
    transitionCommit = false;
  }
};

export const isRouteTransitionCommit = () => transitionCommit;
