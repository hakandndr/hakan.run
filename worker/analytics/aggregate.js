// Scheduled aggregation.
//
// Reads raw events for one completed local day, writes the daily aggregate, and
// records the day in the coverage ledger. It has no delete authority: raw detail
// survives until an explicit, audited owner deletion. There is deliberately no
// retention sweep here, and no expires_at column exists to support one.

import { AGGREGATE_VERSION } from './queries.js';
import { localDay, localDayBounds, shiftDay } from '../lib/time.js';

/** The most recent local day that is complete and therefore safe to aggregate. */
export const lastCompleteDay = (now) => shiftDay(localDay(now), -1);

/**
 * Statements that aggregate one local day and mark it covered.
 * Returned rather than executed so the caller controls batching and the shape
 * stays testable.
 */
export const aggregationStatements = (day, coveredAt) => {
  const { start, end } = localDayBounds(day);
  return [
    {
      sql: `DELETE FROM analytics_daily WHERE aggregate_version = ? AND date_local = ?`,
      params: [AGGREGATE_VERSION, day],
    },
    {
      sql: `INSERT INTO analytics_daily
              (date_local, aggregate_version, path, country, device_class,
               browser_family, actor_class, event_count)
            SELECT date_local, ?, path, COALESCE(country, ''), device_class,
                   browser_family, actor_class, COUNT(*)
            FROM visitor_events
            WHERE occurred_at >= ? AND occurred_at < ?
            GROUP BY date_local, path, COALESCE(country, ''), device_class,
                     browser_family, actor_class`,
      params: [AGGREGATE_VERSION, start, end],
    },
    // The ledger row is written last and only after the aggregate rows exist,
    // so a partially aggregated day is never advertised as covered. A day with
    // no events is still recorded, as a real, readable zero.
    {
      sql: `INSERT INTO analytics_coverage
              (date_local, aggregate_version, event_count, covered_at, source_max_occurred_at)
            SELECT ?, ?, COUNT(*), ?, MAX(occurred_at)
            FROM visitor_events WHERE occurred_at >= ? AND occurred_at < ?
            ON CONFLICT(date_local, aggregate_version) DO UPDATE SET
              event_count = excluded.event_count,
              covered_at = excluded.covered_at,
              source_max_occurred_at = excluded.source_max_occurred_at`,
      params: [day, AGGREGATE_VERSION, coveredAt, start, end],
    },
  ];
};
