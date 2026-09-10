import React, { useEffect, useState } from 'react';
import Application from '@/Application';
import { loadPublishedSiteSnapshot } from '@/content-source/published-site';
import { applyPublishedVisualTokens } from '@/contexts/ContentContext';

export const PUBLIC_BOOTSTRAP_STATE = Object.freeze({
  loading: 'loading',
  ready: 'ready',
  error: 'error',
});

export const NeutralPublicShell = () => (
  <div
    data-public-bootstrap="loading"
    aria-label="Loading published site"
    className="min-h-screen bg-[#090909] text-white"
  >
    <div className="h-20 border-b border-white/[0.06]" />
    <div className="max-w-[1120px] mx-auto px-6 py-20 lg:py-28" aria-hidden="true">
      <div className="h-4 w-40 rounded bg-white/[0.04] mb-10" />
      <div className="h-16 max-w-2xl rounded bg-white/[0.05] mb-5" />
      <div className="h-16 max-w-xl rounded bg-white/[0.035] mb-10" />
      <div className="h-3 max-w-lg rounded bg-white/[0.03] mb-3" />
      <div className="h-3 max-w-md rounded bg-white/[0.03]" />
    </div>
  </div>
);

export const PublicFailure = ({ onRetry }) => (
  <main
    data-public-bootstrap="error"
    className="min-h-screen bg-[#090909] text-white flex items-center justify-center px-6"
  >
    <div className="w-full max-w-xl border border-white/10 rounded-xl bg-[#111112] p-8">
      <p className="font-mono text-xs text-[#57B8FF]/70 mb-3">PUBLIC_SITE / ERROR</p>
      <h1 className="font-mono text-2xl font-bold mb-3">Site unavailable</h1>
      <p className="text-sm text-gray-400 leading-relaxed mb-7">
        The published site could not be loaded safely. No cached or bundled content is being shown.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="font-mono text-sm font-bold px-5 py-3 rounded bg-[#57B8FF] text-[#090909]"
      >
        Retry
      </button>
    </div>
  </main>
);

const PublicBootstrap = () => {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: PUBLIC_BOOTSTRAP_STATE.loading, snapshot: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: PUBLIC_BOOTSTRAP_STATE.loading, snapshot: null });

    loadPublishedSiteSnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        applyPublishedVisualTokens(snapshot.content);
        setState({ status: PUBLIC_BOOTSTRAP_STATE.ready, snapshot });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('[Public bootstrap]', error.code ?? 'unknown_error');
        setState({ status: PUBLIC_BOOTSTRAP_STATE.error, snapshot: null });
      });

    return () => { cancelled = true; };
  }, [attempt]);

  if (state.status === PUBLIC_BOOTSTRAP_STATE.ready) {
    return <Application snapshot={state.snapshot} />;
  }
  if (state.status === PUBLIC_BOOTSTRAP_STATE.error) {
    return <PublicFailure onRetry={() => setAttempt((value) => value + 1)} />;
  }
  return <NeutralPublicShell />;
};

export default PublicBootstrap;
