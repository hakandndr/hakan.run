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
// Precedence, in order of application: `siteContent`, then the `localStorage`
// overlay left by the legacy Admin surface, then the API. The API is applied
// last and therefore wins for every section it publishes. The localStorage
// overlay is a legacy authority that contradicts D-014 and survives only until
// the legacy Admin surface is removed under D-019; it is left in place here
// rather than removed as a side effect of this change, and its precedence is
// pinned by a test so the removal is a decision rather than a discovery.

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
  const [content, setContent] = useState(() => {
    try {
      const stored = localStorage.getItem('siteContent');
      return stored ? { ...siteContent, ...JSON.parse(stored) } : siteContent;
    } catch {
      return siteContent;
    }
  });

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

  // Legacy Admin write path. It writes to browser storage only: the Supabase
  // upsert that used to follow it is gone with the read, so this no longer
  // reaches any shared authority. It is a local preview, and it is labelled as
  // one rather than left looking like publishing. Real publishing belongs to
  // Boss Content against APP_DB, and removing this surface belongs to D-019.
  const updateContent = async (section, value) => {
    setContent(prev => {
      const next = { ...prev, [section]: value };
      try { localStorage.setItem('siteContent', JSON.stringify(next)); } catch (_) {}
      return next;
    });
    console.warn('[Admin] Local preview only — this does not publish. Content authority is APP_DB.');
  };

  return (
    <ContentContext.Provider value={{ content, updateContent, source }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => useContext(ContentContext);
