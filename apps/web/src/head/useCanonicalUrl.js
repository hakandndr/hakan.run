// Single ownership of the document canonical link.
//
// A page document carries exactly one `<link rel="canonical">`; a 404 document
// carries none (document-head.js). Each route declares its canonical URL, or
// `null` when it is not a page, in the component that renders it, as it
// declares its Helmet tags. The declaration rewrites the one link, adds it when
// the document arrived without one, or removes it, so a route reached inside
// the document ends with the link a direct request for it would have sent.

import { useEffect } from 'react';

export const CANONICAL_SELECTOR = 'link[rel="canonical"]';

/**
 * Make the canonical link of `head` name `href`, or remove it when `href` is
 * null, and return the function that puts the previous state back. There is
 * never more than one link: an existing one is rewritten rather than joined.
 *
 * Separate from the hook so the ownership contract is testable without a DOM.
 */
export const applyCanonicalUrl = (head, href) => {
  if (!head?.querySelector) return undefined;
  const link = head.querySelector(CANONICAL_SELECTOR);

  if (href === null) {
    if (!link) return undefined;
    const next = link.nextSibling;
    link.remove();
    return () => {
      if (head.querySelector(CANONICAL_SELECTOR)) return;
      head.insertBefore(link, next?.parentNode === head ? next : null);
    };
  }

  if (!link) {
    const created = head.ownerDocument.createElement('link');
    created.setAttribute('rel', 'canonical');
    created.setAttribute('href', href);
    head.appendChild(created);
    return () => created.remove();
  }

  const previous = link.getAttribute('href');
  link.setAttribute('href', href);
  return () => {
    if (previous === null) link.removeAttribute('href');
    else link.setAttribute('href', previous);
  };
};

/**
 * Declare the route's canonical URL, or `null` for no canonical, while
 * mounted. `undefined` declares nothing (a page rendered as a private preview).
 */
export const useCanonicalUrl = (href) => {
  useEffect(() => {
    if (href === undefined || typeof document === 'undefined') return undefined;
    return applyCanonicalUrl(document.head, href);
  }, [href]);
};
