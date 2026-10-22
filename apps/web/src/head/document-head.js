// Document head composition for server-rendered and prebuilt public documents.
//
// Each route declares its title and meta tags once, through Helmet, in the
// component that renders it. A server render collects those declarations
// (`Helmet.renderStatic()`), and this module writes them into the document the
// browser receives, so crawlers and link previews see the same tags the
// hydrated page manages. Helmet marks its tags with `data-react-helmet`; on
// hydration it keeps identical tags in place instead of replacing them.
//
// Canonical and robots are not Helmet tags. The document ships exactly one of
// each (see useCanonicalUrl.js and useRobotsDirective.js): the canonical href
// follows `publicCanonicalUrl`, and the robots value is owned by the build's
// indexing policy and is left untouched here.

export const PUBLIC_ORIGIN = 'https://hakan.run';

/** The canonical URL of a public route. */
export const publicCanonicalUrl = (pathname) => `${PUBLIC_ORIGIN}${pathname}`;

// The published social card (D-023 names this design as the parity baseline
// for a future generated card). Routes reference it through this constant so a
// generator can replace the URL without touching route metadata.
export const SOCIAL_IMAGE = Object.freeze({
  url: `${PUBLIC_ORIGIN}/og-image.png`,
  width: 1200,
  height: 630,
});

const TITLE = /<title\b[^>]*>[\s\S]*?<\/title>/;
const HELMET_META = /[ \t]*<meta\b[^>]*\bdata-react-helmet="true"[^>]*>\n?/g;
const CANONICAL = /<link rel="canonical" href="[^"]*" \/>/;

const escapeAttribute = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

/**
 * Pure: write a route's collected head into a document.
 *
 * `head.title` and `head.meta` are Helmet's server strings. The document's
 * title is replaced, any earlier Helmet meta tags are removed so a prebuilt
 * document cannot carry two sets, the route's meta tags follow the canonical
 * link, and the canonical href becomes `canonical`. A document without a title
 * or canonical link is refused rather than guessed.
 */
export const applyDocumentHead = (html, { head, canonical }) => {
  if (!TITLE.test(html)) throw new Error('document_title_missing');
  if (!CANONICAL.test(html)) throw new Error('document_canonical_missing');
  const title = head?.title ?? '';
  const meta = (head?.meta ?? '').trim();
  let composed = html.replace(HELMET_META, '');
  if (/>[^<]+</.test(title)) composed = composed.replace(TITLE, () => title);
  const link = `<link rel="canonical" href="${escapeAttribute(canonical)}" />`;
  return composed.replace(CANONICAL, () => (meta ? `${link}\n  ${meta.replace(/\/><meta/g, '/>\n  <meta')}` : link));
};
