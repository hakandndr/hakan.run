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
