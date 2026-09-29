import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import Application from '@/Application';
import { createPublishedSiteSnapshot } from '@/content-source/published-site';
import { applyPublishedVisualTokens } from '@/content-source/visual-tokens';

// The Worker rendered this document from the embedded payload. Hydration
// attaches to that markup; it does not replace it.
export const hydratePublicDocument = (container, payload) => {
  const snapshot = createPublishedSiteSnapshot(payload);
  applyPublishedVisualTokens(snapshot.content);
  hydrateRoot(container, <Application snapshot={snapshot} />);
};
