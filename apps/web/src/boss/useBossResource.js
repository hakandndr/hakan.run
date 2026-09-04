// One loading state machine for every Boss panel.
//
// Four states, and no fifth: loading, error, ready, and ready-but-empty. There
// is deliberately no fallback path — a panel that cannot read its API shows the
// failure rather than public content or a plausible zero.

import { useCallback, useEffect, useState } from 'react';
import { fetchBoss } from './api.js';

export const useBossResource = (path, { enabled = true } = {}) => {
  const [state, setState] = useState({ status: enabled ? 'loading' : 'idle', data: null, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!enabled || !path) return undefined;

    const controller = new AbortController();
    let active = true;

    setState({ status: 'loading', data: null, error: null });

    fetchBoss(path, { signal: controller.signal })
      .then((data) => {
        if (active) setState({ status: 'ready', data, error: null });
      })
      .catch((error) => {
        if (!active || error?.name === 'AbortError') return;
        setState({ status: 'error', data: null, error });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [path, enabled, reloadToken]);

  return { ...state, reload };
};
