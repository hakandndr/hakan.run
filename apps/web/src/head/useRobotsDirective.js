// Single ownership of the document robots directive.
//
// `index.html` ships exactly one `<meta name="robots">`, and the build owns its
// value: a production artifact leaves it at `index, follow`, a staging artifact
// rewrites it to `noindex, nofollow`. React Helmet cannot express "replace that
// tag" — it only manages the tags it created, so a `<meta name="robots">` inside
// a Helmet appends a second element and the document ends up carrying two
// conflicting directives at once. That is what the Boss route did.
//
// So no route declares a robots tag. A route that needs a different directive
// rewrites the value of the one tag that already exists and restores it on the
// way out. There is never more than one, the build's value stays the baseline
// for every route that does not override it, and a staging artifact therefore
// keeps its `noindex, nofollow` on public routes rather than having it undone
// at runtime by a hardcoded public default.

import { useEffect } from 'react';

export const ROBOTS_SELECTOR = 'meta[name="robots"]';

/**
 * Rewrite the value of the existing robots tag in `head`, and return the
 * function that puts the previous value back. Returns undefined when there is
 * no tag to own: an artifact built without one is not a reason to create a
 * second source of truth here, which is the problem this whole module avoids.
 *
 * Separate from the hook so the restore semantics are testable without a DOM.
 */
export const applyRobotsDirective = (head, content) => {
  const meta = head?.querySelector?.(ROBOTS_SELECTOR);
  if (!meta) return undefined;

  const previous = meta.getAttribute('content');
  meta.setAttribute('content', content);

  return () => {
    if (previous === null) meta.removeAttribute('content');
    else meta.setAttribute('content', previous);
  };
};

/** Rewrite the single robots directive for as long as this component is mounted. */
export const useRobotsDirective = (content) => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    return applyRobotsDirective(document.head, content);
  }, [content]);
};
