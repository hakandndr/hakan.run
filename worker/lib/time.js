// America/Los_Angeles day boundaries.
//
// Every date-sensitive analytics metric is expressed in the operator's local
// day, not UTC. Boundaries are resolved through Intl rather than a fixed offset
// so daylight-saving transitions land on the real local midnight.

export const OPS_TIME_ZONE = 'America/Los_Angeles';

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: OPS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const partsFormatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory', {
  timeZone: OPS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const partsOf = (formatter, instant) =>
  Object.fromEntries(
    formatter
      .formatToParts(new Date(instant))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

/** The local calendar day, as `YYYY-MM-DD`, that an instant falls in. */
export const localDay = (instant) => {
  const parts = partsOf(dayFormatter, instant);
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
};

/** Shift a `YYYY-MM-DD` key by whole days. */
export const shiftDay = (day, days) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date + days)).toISOString().slice(0, 10);
};

// Local midnight resolved by successive correction: DST shifts the offset, so a
// fixed guess can be an hour out twice a year.
const localMidnightUtc = (day) => {
  const [year, month, date] = day.split('-').map(Number);
  const target = Date.UTC(year, month - 1, date);
  let candidate = target;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = partsOf(partsFormatter, candidate);
    const represented = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const correction = target - represented;
    if (correction === 0) break;
    candidate += correction;
  }
  return candidate;
};

/** Half-open `[start, end)` instant bounds of a local day. */
export const localDayBounds = (day) => ({
  start: localMidnightUtc(day),
  end: localMidnightUtc(shiftDay(day, 1)),
});

/** Inclusive list of local day keys from `from` to `to`, capped for safety. */
export const localDayRange = (from, to, maxDays = 400) => {
  const days = [];
  for (let day = from; day <= to; day = shiftDay(day, 1)) {
    days.push(day);
    if (days.length > maxDays) return null;
  }
  return days.length > 0 ? days : null;
};

/** Whole days between two local day keys. */
export const daysBetween = (from, to) =>
  Math.round((localMidnightUtc(to) - localMidnightUtc(from)) / 86_400_000);
