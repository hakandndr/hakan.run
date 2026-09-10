import React, { createContext, useContext } from 'react';

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

export const applyPublishedVisualTokens = (content) => {
  const root = document.documentElement;
  const { colors, typography } = content;

  root.style.setProperty('--color-accent-rgb', hexToRgbChannels(colors.accentPurple));
  root.style.setProperty('--color-bg', colors.background);
  root.style.setProperty('--color-card-bg', colors.cardBackground);
  root.style.setProperty('--color-hero-overlay', hexToRgba(colors.heroOverlay, 0.4));
  document.body.setAttribute('data-heading-font', typography.headingFont);
  document.body.setAttribute('data-body-size', typography.bodySize);
  document.body.setAttribute('data-spacing', typography.sectionSpacing);
};

export const ContentProvider = ({ snapshot, children, preview = false }) => (
  <ContentContext.Provider value={{ content: snapshot.content, snapshot, preview }}>
    {children}
  </ContentContext.Provider>
);

export const PreviewContentProvider = ({ snapshot, children }) => (
  <ContentProvider snapshot={snapshot} preview>{children}</ContentProvider>
);

export const useContent = () => {
  const value = useContext(ContentContext);
  if (!value) throw new Error('ContentProvider requires an explicit PublishedSiteSnapshot');
  return value;
};
