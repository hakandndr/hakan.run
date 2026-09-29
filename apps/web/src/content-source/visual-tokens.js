const hexToRgbChannels = (hex) => {
  const color = hex.replace('#', '');
  return `${parseInt(color.slice(0, 2), 16)} ${parseInt(color.slice(2, 4), 16)} ${parseInt(color.slice(4, 6), 16)}`;
};

const hexToRgba = (hex, alpha) => {
  const color = hex.replace('#', '');
  const red = parseInt(color.slice(0, 2), 16);
  const green = parseInt(color.slice(2, 4), 16);
  const blue = parseInt(color.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

// One definition of the published theme tokens. The browser applies it after
// loading a snapshot; the Worker writes the same values into server-rendered
// documents so the first paint already carries them.
export const publishedVisualTokens = ({ colors, typography }) => ({
  properties: {
    '--color-accent-rgb': hexToRgbChannels(colors.accentPurple),
    '--color-bg': colors.background,
    '--color-card-bg': colors.cardBackground,
    '--color-hero-overlay': hexToRgba(colors.heroOverlay, 0.4),
  },
  bodyAttributes: {
    'data-heading-font': typography.headingFont,
    'data-body-size': typography.bodySize,
    'data-spacing': typography.sectionSpacing,
  },
});

export const applyPublishedVisualTokens = (content) => {
  const { properties, bodyAttributes } = publishedVisualTokens(content);
  for (const [name, value] of Object.entries(properties)) document.documentElement.style.setProperty(name, value);
  for (const [name, value] of Object.entries(bodyAttributes)) document.body.setAttribute(name, value);
};
