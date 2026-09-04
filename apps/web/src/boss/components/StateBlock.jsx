import React from 'react';

const shell = 'border border-white/10 bg-[#151515] rounded p-6 font-mono text-sm';

export const LoadingState = ({ label = 'reading' }) => (
  <div className={`${shell} text-gray-500`} role="status" aria-live="polite" data-boss-state="loading">
    <span className="text-accent-purple select-none">&#10095;</span> {label}
    <span className="animate-pulse text-accent-purple select-none"> &#9611;</span>
  </div>
);

export const EmptyState = ({ message }) => (
  <div className={`${shell} text-gray-500`} data-boss-state="empty">
    <span className="text-gray-700 select-none">{'/* '}</span>
    {message}
    <span className="text-gray-700 select-none">{' */'}</span>
  </div>
);

/**
 * Errors are loud on purpose. A Boss panel that quietly renders nothing when
 * its API refuses is indistinguishable from one that is genuinely empty.
 */
export const ErrorState = ({ error, onRetry }) => (
  <div
    className="border border-red-500/40 bg-red-500/5 rounded p-6 font-mono text-sm"
    role="alert"
    data-boss-state="error"
  >
    <p className="text-red-300 mb-2">
      <span className="select-none">! </span>
      {error?.message ?? 'The request failed.'}
    </p>
    <p className="text-gray-500 text-xs mb-4">
      {error?.path ? <span>{error.path}</span> : null}
      {error?.status ? <span> &middot; HTTP {error.status}</span> : null}
      {error?.code ? <span> &middot; {error.code}</span> : null}
    </p>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="text-accent-purple border border-accent-purple/30 hover:bg-accent-purple/10 px-4 py-2 rounded transition-colors"
      >
        <span className="opacity-50 select-none">$</span> retry
      </button>
    ) : null}
  </div>
);
