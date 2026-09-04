// Summary assembly.
//
// One entry point produces every summary figure the Boss Analytics module
// shows. It resolves trusted coverage first, then reads aggregates for covered
// days and raw events for everything else, and merges before truncating.
//
// The caller supplies `run({ sql, params })`, so the same code path serves the
// Worker (D1) and the tests (SQLite). There is no second implementation.

import {
  aggregateCountriesQuery,
  aggregateDailySeriesQuery,
  aggregateTopPagesQuery,
  aggregateTotalsQuery,
  coveredDaysQuery,
  rawCountriesQuery,
  rawDailySeriesQuery,
  rawTopPagesQuery,
  rawTotalsQuery,
  uniqueAddressesQuery,
} from './queries.js';
import {
  mergeDailySeries,
  mergeLabelledCounts,
  mergeTotals,
  planSources,
} from './coverage.js';
import { localDayBounds } from '../lib/time.js';

const number = (rows, key = 'value') => Number(rows?.[0]?.[key] ?? 0);

/**
 * @param {(query: {sql: string, params: unknown[]}) => Promise<Array<Record<string, unknown>>>} run
 */
export const buildSummary = async (run, options) => {
  const { from, to, today, filters = {}, topLimit = 10 } = options;

  // Coverage is read, never inferred. Only these rows authorise aggregate use.
  const coveredRows = await run(coveredDaysQuery(from, to));
  const covered = new Set(coveredRows.map((row) => String(row.day)));

  const plan = planSources(from, to, covered, today);
  if (!plan) return null;

  // A filter that aggregates cannot express forces the whole range to raw.
  // Daily aggregates carry path, country, device, browser and actor only; an
  // IP, city or referrer filter has no aggregate representation, and silently
  // ignoring it would report the wrong number.
  const aggregateCapable =
    !filters.ip && !filters.city && !filters.referrer && !filters.pathExact;
  const aggregateDays = aggregateCapable ? plan.aggregateDays : [];
  const rawRanges = aggregateCapable
    ? plan.rawRanges
    : [{ start: localDayBounds(from).start, end: localDayBounds(to).end }];

  const runOptional = async (query) => (query ? run(query) : []);
  const forEachRawRange = async (builder) => {
    const results = [];
    for (const range of rawRanges) results.push(await run(builder(range)));
    return results;
  };

  const [aggregateTotals, aggregateTop, aggregateCountries, aggregateSeries] =
    await Promise.all([
      runOptional(aggregateTotalsQuery(aggregateDays)),
      runOptional(aggregateTopPagesQuery(aggregateDays)),
      runOptional(aggregateCountriesQuery(aggregateDays)),
      runOptional(aggregateDailySeriesQuery(aggregateDays)),
    ]);

  const rawTotals = await forEachRawRange((range) => rawTotalsQuery(range, filters));
  const rawTop = await forEachRawRange((range) => rawTopPagesQuery(range, filters));
  const rawCountries = await forEachRawRange((range) => rawCountriesQuery(range, filters));
  const rawSeries = await forEachRawRange((range) => rawDailySeriesQuery(range, filters));

  const totals = mergeTotals([
    ...(aggregateTotals.length > 0 ? [aggregateTotals[0]] : []),
    ...rawTotals.map((rows) => rows[0] ?? {}),
  ]);

  // Exact and raw-only across the whole selected range, because distinct counts
  // do not sum across days.
  const rangeBounds = { start: localDayBounds(from).start, end: localDayBounds(to).end };
  const uniqueRows = await run(uniqueAddressesQuery(rangeBounds, filters));

  // Today is always raw: the current local day is still accumulating.
  const todayBounds = localDayBounds(today);
  const todayRows =
    today >= from && today <= to ? await run(rawTotalsQuery(todayBounds, filters)) : [];

  return {
    timeZone: 'America/Los_Angeles',
    range: { from, to, today },
    coverage: {
      aggregateDays: plan.aggregateDays,
      rawDays: plan.rawDays,
      aggregateUsed: aggregateDays.length > 0,
      aggregateSuppressedByFilter: !aggregateCapable && plan.aggregateDays.length > 0,
    },
    totals: {
      events: totals.events,
      human: totals.human,
      automated: totals.automated,
      today: Number(todayRows?.[0]?.events ?? 0),
      uniqueAddresses: number(uniqueRows),
    },
    topPages: mergeLabelledCounts([aggregateTop, ...rawTop], topLimit),
    countries: mergeLabelledCounts([aggregateCountries, ...rawCountries], topLimit),
    trend: mergeDailySeries(plan.days, [aggregateSeries, ...rawSeries]),
  };
};
