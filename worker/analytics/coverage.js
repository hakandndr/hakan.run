// Coverage-aware source planning.
//
// A summary is answered from two sources: daily aggregates for local days the
// coverage ledger explicitly marks as covered, and raw events for everything
// else. This module decides which is which, and merges the results.
//
// Coverage is never inferred. Only a ledger row proves a day was aggregated.
// The current local day is always raw, because it is still accumulating.

import { localDayBounds, localDayRange, shiftDay } from '../lib/time.js';

/**
 * Split a local-day range into aggregate-backed days and contiguous raw
 * instant ranges.
 *
 * @param {string} from       inclusive local day key
 * @param {string} to         inclusive local day key
 * @param {Set<string>} covered  local day keys proven covered by the ledger
 * @param {string} today      current local day key; always treated as raw
 */
export const planSources = (from, to, covered, today) => {
  const days = localDayRange(from, to);
  if (!days) return null;

  const aggregateDays = [];
  const rawDays = [];
  for (const day of days) {
    if (day < today && covered.has(day)) aggregateDays.push(day);
    else rawDays.push(day);
  }

  // Contiguous raw days collapse into one indexed range scan each, so a
  // trailing partial day or a single missing middle day costs one range, not
  // one query per day.
  const rawRanges = [];
  for (const day of rawDays) {
    const bounds = localDayBounds(day);
    const previous = rawRanges[rawRanges.length - 1];
    if (previous && previous.endDay === shiftDay(day, -1)) {
      previous.end = bounds.end;
      previous.endDay = day;
    } else {
      rawRanges.push({ start: bounds.start, end: bounds.end, startDay: day, endDay: day });
    }
  }

  return { days, aggregateDays, rawDays, rawRanges };
};

/**
 * Merge labelled counts from both sources, then truncate.
 *
 * Truncating either source before the merge is the classic ranking bug: a
 * country ranked 11th in aggregates and 11th in raw can be 3rd overall.
 */
export const mergeLabelledCounts = (sources, limit) => {
  const totals = new Map();
  for (const rows of sources) {
    for (const row of rows) {
      const label = row.label ?? '';
      totals.set(label, (totals.get(label) ?? 0) + Number(row.value ?? 0));
    }
  }
  const merged = [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => (b.value - a.value) || a.label.localeCompare(b.label));
  return typeof limit === 'number' ? merged.slice(0, limit) : merged;
};

/**
 * Merge per-day series from both sources into one dense series.
 *
 * Every requested day appears exactly once. A covered day with no events is a
 * real zero; an uncovered day with no raw events is also zero, but it was
 * counted, not assumed.
 */
export const mergeDailySeries = (days, sources) => {
  const totals = new Map(days.map((day) => [day, 0]));
  for (const rows of sources) {
    for (const row of rows) {
      if (!totals.has(row.label)) continue;
      totals.set(row.label, totals.get(row.label) + Number(row.value ?? 0));
    }
  }
  return days.map((day) => ({ label: day, value: totals.get(day) }));
};

/** Sum scalar totals from both sources. */
export const mergeTotals = (parts) =>
  parts.reduce(
    (accumulator, part) => ({
      events: accumulator.events + Number(part.events ?? 0),
      human: accumulator.human + Number(part.human ?? 0),
      automated: accumulator.automated + Number(part.automated ?? 0),
    }),
    { events: 0, human: 0, automated: 0 },
  );
