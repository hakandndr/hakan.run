// Runtime content authority.
//
// `/api/content`, backed by APP_DB, is the only runtime source of published
// content. The Supabase read that used to live here is gone: staging must not
// be able to reach the production project at runtime (D-020), and a binding
// that does not exist cannot be misconfigured into existence.
//
// The role of the built-in fallback, stated once so it is not mistaken for a
// second authority:
//
//   `siteContent` is the synchronous initial value. Every section key exists in
//   it, so components that read nested fields — `content.colors.accentPurple`,
//   `content.hero.headingLine1` — have something to read on the first paint,
//   before any network answer exists. Without it the first render would throw
//   on undefined, not merely look unstyled.
//
//   It is NOT a stand-in for content that failed to load. When the API fails,
//   the fallback stays on screen, because a blank site helps nobody — but the
//   failure is recorded as a failure and reported, and is never presented as
//   "there is no content". Those are different facts and `source` keeps them
//   apart.
//
// Published API sections override the built-in fallback. Browser storage is
// never a content source; mutations belong to the authenticated Boss API.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { siteContent } from '@/content';
import { CONTENT_STATE, loadContent, mergeSections } from '@/content-source/source';

const ContentContext = createContext(null);

const hexToRgbChannels = (hex) => {
  const c = hex.replace('#', '');
  return `${parseInt(c.slice(0,2),16)} ${parseInt(c.slice(2,4),16)} ${parseInt(c.slice(4,6),16)}`;
};

const hexToRgba = (hex, alpha) => {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0,2),16);
  const g = parseInt(c.slice(2,4),16);
  const b = parseInt(c.slice(4,6),16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const applyColors = (colors) => {
  const root = document.documentElement;
  root.style.setProperty('--color-accent-rgb', hexToRgbChannels(colors.accentPurple));
  root.style.setProperty('--color-bg', colors.background);
  root.style.setProperty('--color-card-bg', colors.cardBackground);
  root.style.setProperty('--color-hero-overlay', hexToRgba(colors.heroOverlay ?? '#000000', 0.4));
};

const applyTypography = (typography) => {
  if (!typography) return;
  const body = document.body;
  body.setAttribute('data-heading-font', typography.headingFont || 'mono');
  body.setAttribute('data-body-size', typography.bodySize || 'md');
  body.setAttribute('data-spacing', typography.sectionSpacing || 'default');
};

export const ContentProvider = ({ children }) => {
  const [content, setContent] = useState(siteContent);

  const [source, setSource] = useState({ state: CONTENT_STATE.loading, reason: null, count: 0 });

  useEffect(() => { applyColors(content.colors); },      [content.colors]);
  useEffect(() => { applyTypography(content.typography); }, [content.typography]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await loadContent();
      if (cancelled) return;

      setSource({ state: result.state, reason: result.reason, count: result.sections.length });

      // Only a successful read with published sections changes what is
      // rendered. `empty` and `failed` both leave the fallback in place, and
      // neither is allowed to apply a partial overlay: `result.sections` is
      // empty for both, so there is nothing to merge even by accident.
      if (result.state === CONTENT_STATE.ready) {
        setContent((prev) => mergeSections(prev, result.sections));
      }

      // A failure is reported rather than swallowed. Rendering the fallback is
      // the right thing to show a visitor; it is not the right thing to tell an
      // operator, and this is the only place that distinction is visible.
      if (result.state === CONTENT_STATE.failed) {
        console.error('[Content] /api/content failed:', result.reason, '— showing built-in fallback');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <ContentContext.Provider value={{ content, source }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => useContext(ContentContext);

// A controlled, memory-only provider for the private renderer. It never reads
// browser storage or public APIs, and CSS changes stay in the iframe document.
export const PreviewContentProvider = ({ content, children }) => {
  useEffect(() => { applyColors(content.colors); applyTypography(content.typography); }, [content]);
  return <ContentContext.Provider value={{ content, preview: true }}>{children}</ContentContext.Provider>;
};
