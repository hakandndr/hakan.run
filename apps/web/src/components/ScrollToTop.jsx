import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const lastPathname = useRef(null);

  useEffect(() => {
    // Skip the first run: on an initial load or a refresh the browser performs
    // its own native scroll restoration, and forcing the top here would undo it.
    // Only in-app route changes reset the scroll position.
    const previous = lastPathname.current;
    lastPathname.current = pathname;
    if (previous === null || previous === pathname) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
