import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Scroll behaviour is deliberately minimal: in-app route changes start at the
// top, and everything else is left to the browser.
//
// Refresh and history navigation are handled by native scroll restoration.
// That works because the first paint already renders the full, known-good page,
// so the document has its final height while the browser is restoring. There is
// no saved-position bookkeeping and no retry loop here on purpose — those were
// timing workarounds for an initial render that changed after load.

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const sawInitialRender = useRef(false);

  useEffect(() => {
    // The first run is the initial load or a refresh: leave it to the browser.
    if (!sawInitialRender.current) {
      sawInitialRender.current = true;
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
