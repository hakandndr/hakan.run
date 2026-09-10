import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CONTENT_STATE } from '@/content-source/source';
import { useContent } from '@/contexts/ContentContext';

const STORAGE_KEY = 'scrollPositions';
const RESTORE_TIMEOUT_MS = 3000;
const CANCEL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];

const readPositions = () => {
  try {
    const positions = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '{}');
    return positions && typeof positions === 'object' ? positions : {};
  } catch {
    return {};
  }
};

const savePosition = (pathname) => {
  try {
    const positions = readPositions();
    positions[pathname] = Math.round(window.scrollY);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Storage can be unavailable; scroll restoration remains a progressive enhancement.
  }
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const { source } = useContent();
  const pathnameRef = useRef(pathname);
  const contentReadyRef = useRef(source.state !== CONTENT_STATE.loading);
  const initialPathname = useRef(pathname);
  const sawInitialRender = useRef(false);
  const restoreDone = useRef(false);

  pathnameRef.current = pathname;
  contentReadyRef.current = source.state !== CONTENT_STATE.loading;

  useEffect(() => {
    const save = () => savePosition(pathnameRef.current);
    const saveWhenHidden = () => {
      if (document.visibilityState === 'hidden') save();
    };

    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', saveWhenHidden);

    return () => {
      window.removeEventListener('pagehide', save);
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', saveWhenHidden);
    };
  }, []);

  useEffect(() => {
    const target = readPositions()[initialPathname.current];
    if (!Number.isFinite(target) || target <= 0) {
      restoreDone.current = true;
      return undefined;
    }

    const deadline = Date.now() + RESTORE_TIMEOUT_MS;
    let frame = null;

    const stop = () => {
      restoreDone.current = true;
      if (frame !== null) cancelAnimationFrame(frame);
      CANCEL_EVENTS.forEach(name => window.removeEventListener(name, stop));
    };

    CANCEL_EVENTS.forEach(name => window.addEventListener(name, stop, { passive: true }));

    const restore = () => {
      if (restoreDone.current || Date.now() > deadline) {
        stop();
        return;
      }

      const reachable = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const desired = Math.min(target, reachable);
      if (Math.round(window.scrollY) !== desired) window.scrollTo(0, desired);

      if (
        contentReadyRef.current &&
        desired === target &&
        Math.round(window.scrollY) === target
      ) {
        stop();
        return;
      }

      frame = requestAnimationFrame(restore);
    };

    frame = requestAnimationFrame(restore);
    return stop;
  }, []);

  useEffect(() => {
    if (!sawInitialRender.current) {
      sawInitialRender.current = true;
      return;
    }

    restoreDone.current = true;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
