import React, { useState } from 'react';
import { useBossResource } from '../useBossResource.js';
import { LoadingState, ErrorState, EmptyState } from '../components/StateBlock.jsx';
import { DataTable, Panel } from '../components/Panel.jsx';
import { formatBossInstant } from '../time.js';

const stateClass = {
  sent: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  failed: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  disabled: 'border-gray-500/30 bg-gray-500/10 text-gray-400',
  stored: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
};

const Badge = ({ value }) => (
  <span className={`inline-flex rounded border px-2 py-1 font-mono text-[10px] ${stateClass[value] ?? stateClass.stored}`}>
    {value ?? 'unknown'}
  </span>
);

const Metadata = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="font-mono text-[9px] uppercase tracking-wider text-gray-600">{label}</dt>
    <dd className="mt-1 break-all font-mono text-xs text-gray-300">{value || '—'}</dd>
  </div>
);

const SubmissionDetail = ({ submission, onClose }) => (
  <article className="rounded border border-white/10 bg-[#111111] overflow-hidden">
    <header className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="font-mono text-sm text-white break-words">{submission.name}</h3>
        <a className="font-mono text-xs text-sky-300 hover:underline break-all" href={`mailto:${submission.email}`}>
          {submission.email}
        </a>
        <p className="mt-1 font-mono text-[10px] text-gray-600">
          Received {formatBossInstant(submission.received_at)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-white/10 px-2 py-1 font-mono text-[10px] text-gray-400">
          {submission.status}
        </span>
        <Badge value={submission.notification_state} />
        <button
          type="button"
          className="rounded border border-white/10 px-2 py-1 font-mono text-[10px] text-gray-400 hover:text-white"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </header>

    <div className="p-4 space-y-4">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-wider text-gray-600">Message</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-200">
          {submission.message}
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-4 border-t border-white/10 pt-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metadata label="Source" value={submission.source_path} />
        <Metadata label="Country" value={submission.country} />
        <Metadata label="Submission ID" value={submission.id} />
        <Metadata label="Cloudflare request" value={submission.request_id} />
        <Metadata label="Notification provider" value={submission.notification_provider} />
        <Metadata label="Provider status" value={submission.notification_provider_status} />
        <Metadata label="Provider request" value={submission.notification_request_id} />
        <Metadata label="Notification attempts" value={String(submission.notification_attempts ?? 0)} />
        <Metadata label="Last attempted" value={formatBossInstant(submission.notification_attempted_at)} />
        <Metadata label="Notified" value={formatBossInstant(submission.notified_at)} />
      </dl>

      {submission.notification_error ? (
        <div className="rounded border border-rose-400/25 bg-rose-400/5 px-3 py-2" role="status">
          <p className="font-mono text-[9px] uppercase tracking-wider text-rose-300/70">Notification error</p>
          <p className="mt-1 break-all font-mono text-xs text-rose-300">{submission.notification_error}</p>
        </div>
      ) : null}

      <details className="border-t border-white/10 pt-3">
        <summary className="cursor-pointer select-none font-mono text-[10px] text-gray-500 hover:text-gray-300">
          User agent
        </summary>
        <p className="mt-2 break-all font-mono text-[10px] leading-5 text-gray-600">
          {submission.user_agent || '—'}
        </p>
      </details>
    </div>
  </article>
);

const Submissions = () => {
  const { status, data, error, reload } = useBossResource('/api/boss/submissions');
  const [selectedId, setSelectedId] = useState(null);
  if (status === 'loading') return <LoadingState label="reading /api/boss/submissions" />;
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />;

  const submissions = data.submissions ?? [];
  const selected = submissions.find((submission) => submission.id === selectedId) ?? null;
  return (
    <Panel
      title="Submissions"
      hint="APP_DB records · newest first · America/Los_Angeles · delivery never gates persistence"
    >
      {submissions.length === 0 ? (
        <EmptyState message="No submissions recorded in this environment yet." />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                key: 'received_at',
                label: 'Received (PT)',
                render: (row) => formatBossInstant(row.received_at),
              },
              {
                key: 'sender',
                label: 'Sender',
                render: (row) => (
                  <span className="block min-w-[12rem]">
                    <span className="block text-white">{row.name}</span>
                    <span className="block text-sky-300 break-all">{row.email}</span>
                  </span>
                ),
              },
              { key: 'status', label: 'Status' },
              {
                key: 'notification_state',
                label: 'Notification',
                render: (row) => <Badge value={row.notification_state} />,
              },
              {
                key: 'inspect',
                label: 'Detail',
                render: (row) => (
                  <button
                    type="button"
                    className="rounded border border-white/10 px-2 py-1 text-sky-300 hover:border-sky-300/40"
                    onClick={() => setSelectedId(row.id)}
                  >
                    Inspect
                  </button>
                ),
              },
            ]}
            rows={submissions}
            rowKey={(row) => row.id}
          />
          {selected ? (
            <SubmissionDetail submission={selected} onClose={() => setSelectedId(null)} />
          ) : null}
        </div>
      )}
    </Panel>
  );
};

export default Submissions;
