// Versioned PAGE classification evidence for legacy-import snapshots.
//
// Public routes evolve with the application. A verified historical prefix must
// therefore carry the route contract that classified it, while newly appended
// records continue to use the current application contract.

import { CANONICAL_PAGES, PROJECT_PREFIX } from '../../worker/lib/routes.js';

export const CLASSIFICATION_CONTRACT_VERSION = 1;

export const currentClassification = () => ({
  version: CLASSIFICATION_CONTRACT_VERSION,
  canonicalPages: [...CANONICAL_PAGES],
  projectPrefix: PROJECT_PREFIX,
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
