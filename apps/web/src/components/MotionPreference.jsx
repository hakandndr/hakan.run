import React from 'react';
import { MotionConfig } from 'framer-motion';

// The reduced-motion contract for framer-motion components, matching the CSS
// rule in index.css. With `prefers-reduced-motion: reduce`, framer-motion
// skips transform and layout animations (the element is placed at its target
// at once) and keeps opacity and color, so entrances and the mobile menu still
// appear without moving across the screen. Every public React tree renders
// inside it; components do not read the preference themselves.
const MotionPreference = ({ children }) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);

export default MotionPreference;
