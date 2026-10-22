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
// rewrites the value of the one tag that already exists, and on the way out
// sets it back to the build directive. There is never more than one, the
// build's value stays the baseline for every route that does not override it,
// and a staging artifact therefore keeps its `noindex, nofollow` on public
// routes rather than having it undone at runtime by a hardcoded public default.
//
// The way out restores the build directive rather than the value found in the
// tag: a document that arrived as a 404 already carries the not-found
// directive, so the value found there would keep the next page `noindex`.

import { useEffect } from 'react';
import { buildRobotsDirective } from './indexing-policy.js';

export const ROBOTS_SELECTOR = 'meta[name="robots"]';

// The same mode the build used to write the tag (tools/build.js passes one
// mode to both). Outside a Vite bundle there is no mode: the production value.
export const BUILD_ROBOTS_DIRECTIVE = buildRobotsDirective(import.meta.env?.MODE);

/**
 * Rewrite the value of the existing robots tag in `head`, and return the
 * function that sets it back to `baseline`, the build directive. Returns
 * undefined when there is no tag to own: an artifact built without one is not
 * a reason to create a second source of truth here, which is the problem this
 * whole module avoids.
 *
 * Separate from the hook so the restore semantics are testable without a DOM.
 */
export const applyRobotsDirective = (head, content, baseline) => {
  const meta = head?.querySelector?.(ROBOTS_SELECTOR);
  if (!meta) return undefined;

  meta.setAttribute('content', content);
  return () => meta.setAttribute('content', baseline);
};

/** Rewrite the single robots directive for as long as this component is mounted. */
export const useRobotsDirective = (content) => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    return applyRobotsDirective(document.head, content, BUILD_ROBOTS_DIRECTIVE);
  }, [content]);
};
