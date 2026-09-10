import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const sawInitialRender = useRef(false);

  useEffect(() => {
    // Leave initial loads and refreshes to the browser's native scroll restoration.
    if (!sawInitialRender.current) {
      sawInitialRender.current = true;
      return;
    }

    // Client-side route changes should still begin at the top of the new page.
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
