// Canonical public content sections.
//
// `content_sections` has no ordering column, and alphabetical order by primary
// key is an accident of storage rather than a contract. Section order is a
// source-controlled fact, declared here once and used by the public read path
// and by the bootstrap, so the API's ordering cannot drift with the data.
//
// The list is the twelve keys the legacy Supabase `site_content` table and the
// frontend fallback object both use. Membership is not enforced at read time: a
// section that is not on this list is still returned, ordered after the known
// ones by id, because a future section should be publishable without an outage.
// The list governs order and is what the bootstrap validates a snapshot against.

export const CANONICAL_SECTIONS = [
  'colors',
  'typography',
  'visibility',
  'header',
  'hero',
  'services',
  'about',
  'portfolio',
  'stats',
  'cta',
  'contact',
  'footer',
];

const rank = new Map(CANONICAL_SECTIONS.map((id, index) => [id, index]));

/** Deterministic order: canonical sections in declared order, then the rest by id. */
export const compareSections = (a, b) => {
  const left = rank.has(a) ? rank.get(a) : CANONICAL_SECTIONS.length;
  const right = rank.has(b) ? rank.get(b) : CANONICAL_SECTIONS.length;
  if (left !== right) return left - right;
  return a < b ? -1 : a > b ? 1 : 0;
};

export const isCanonicalSection = (id) => rank.has(id);
