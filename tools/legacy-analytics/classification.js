// Versioned PAGE classification evidence for legacy-import snapshots.
//
// A verified historical prefix carries the route contract that classified it.
// The legacy log is the retired PHP logger's record of the legacy site
// (2026-03-26 to 2026-09-05), when project-detail pages existed, so version 1
// is a fixed historical contract: the canonical pages and the `/project/`
// prefix as they were. It deliberately does not follow the live runtime rule
// (apps/web/src/router/public-pages.js), which dropped `/project/*` after those
// pages were removed (D-050); following it would reinterpret history.

export const CLASSIFICATION_CONTRACT_VERSION = 1;

const LEGACY_CLASSIFICATION = Object.freeze({
  canonicalPages: Object.freeze(['/', '/card', '/contact', '/notes']),
  projectPrefix: '/project/',
});

export const currentClassification = () => ({
  version: CLASSIFICATION_CONTRACT_VERSION,
  canonicalPages: [...LEGACY_CLASSIFICATION.canonicalPages],
  projectPrefix: LEGACY_CLASSIFICATION.projectPrefix,
});

export const validateClassification = (classification) => {
  if (!classification || classification.version !== CLASSIFICATION_CONTRACT_VERSION
    || !Array.isArray(classification.canonicalPages)
    || classification.canonicalPages.length === 0
    || classification.canonicalPages.some((route) => typeof route !== 'string' || !route.startsWith('/'))
    || new Set(classification.canonicalPages).size !== classification.canonicalPages.length
    || typeof classification.projectPrefix !== 'string'
    || !classification.projectPrefix.startsWith('/')
    || !classification.projectPrefix.endsWith('/')) {
    throw new Error('Invalid previous snapshot classification contract');
  }
  return classification;
};

export const isPublicPageFor = (path, classification) => {
  const policy = validateClassification(classification);
  if (policy.canonicalPages.includes(path)) return true;
  if (!path.startsWith(policy.projectPrefix)) return false;
  const slug = path.slice(policy.projectPrefix.length).replace(/\/$/, '');
  return slug.length > 0 && slug.length <= 128 && /^[a-z0-9-]+$/.test(slug);
};
