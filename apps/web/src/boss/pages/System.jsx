import React from 'react';
import { useBossResource } from '../useBossResource.js';
import { LoadingState, ErrorState } from '../components/StateBlock.jsx';
import { Panel, StatGrid } from '../components/Panel.jsx';

const Binding = ({ label, present, note }) => (
  <div className="flex items-baseline justify-between gap-4 border border-white/10 bg-[#151515] rounded px-4 py-3">
    <div>
      <p className="font-mono text-sm text-gray-300">{label}</p>
      {note ? <p className="font-mono text-xs text-gray-600 mt-1">{note}</p> : null}
    </div>
    <span className={`font-mono text-xs ${present ? 'text-accent-purple' : 'text-red-400'}`}>
      {present ? 'configured' : 'absent'}
    </span>
  </div>
);

// Retention is a policy commitment surfaced here, not a scheduled delete.
// Decision D-021: the aggregation job never removes raw detail, so the age of
// the oldest retained event and its overdue state are what make the promise
// observable instead of assumed.

const System = () => {
  const { status, data, error, reload } = useBossResource('/api/boss/system');

  if (status === 'loading') return <LoadingState label="reading /api/boss/system" />;
  if (status === 'error') return <ErrorState error={error} onRetry={reload} />;

  const { analytics, bindings, environment } = data;

  return (
    <>
      <Panel title="Environment">
        <StatGrid
          items={[
            { label: 'Environment', value: environment ?? 'unknown' },
            { label: 'Retained events', value: analytics.retainedEvents },
            {
              label: 'Oldest retained event',
              value: analytics.oldestEventDay ?? 'none',
              note: `${analytics.oldestEventAgeDays} day(s) old`,
            },
            {
              label: 'Retention policy',
              value: `${analytics.policyMaximumDays} days`,
              note: analytics.automaticPurge
                ? 'Automatic purge enabled'
                : 'No automatic purge; deletion is an audited operator action',
            },
          ]}
        />
        {analytics.retentionOverdue ? (
          <p
            className="mt-4 border border-red-500/40 bg-red-500/5 rounded px-4 py-3 font-mono text-sm text-red-300"
            role="alert"
          >
            <span className="select-none">! </span>
            Raw analytics detail is older than the {analytics.policyMaximumDays}-day policy maximum.
            The retention commitment is overdue and needs an audited deletion.
          </p>
        ) : null}
      </Panel>

      <Panel title="Bindings" hint="Reported by the Worker; secret values are never exposed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Binding label="APP_DB" present={bindings.appDb} note="Content, submissions and audit" />
          <Binding label="ANALYTICS_DB" present={bindings.analyticsDb} note="PAGE events and aggregates" />
          <Binding label="Turnstile" present={bindings.turnstile} note="Server-side verification secret" />
          <Binding
            label="Access verification"
            present={bindings.access}
            note="Team domain, audience and owner all present"
          />
          <Binding
            label="Notifications"
            present={bindings.notifications}
            note="Delivery only; never the record of a submission"
          />
        </div>
      </Panel>
    </>
  );
};

export default System;
