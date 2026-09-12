import { useEffect } from 'react';

export const CANONICAL_SELECTOR = 'link[rel="canonical"]';

export const applyCanonicalUrl = (head, href) => {
  const link = head?.querySelector?.(CANONICAL_SELECTOR);
  if (!link) return undefined;

  const previous = link.getAttribute('href');
  link.setAttribute('href', href);

  return () => {
    if (previous === null) link.removeAttribute('href');
    else link.setAttribute('href', previous);
  };
};

export const useCanonicalUrl = (href) => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    return applyCanonicalUrl(document.head, href);
  }, [href]);
};
