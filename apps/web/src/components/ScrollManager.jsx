import React, { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Document loads and browser-history POP navigation belong to the browser.
// This component owns only explicit client-side PUSH/REPLACE navigation.
const ScrollManager = ({ navigationType }) => {
  const location = useLocation();

  useLayoutEffect(() => {
    if (navigationType === 'POP') return;

    const behavior = location.state?.scrollBehavior === 'smooth' ? 'smooth' : 'auto';
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior });
  }, [location, navigationType]);

  return null;
};

export default ScrollManager;
