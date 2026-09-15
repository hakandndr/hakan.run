export const BOSS_TIME_ZONE = 'America/Los_Angeles';

const bossInstantFormatter = new Intl.DateTimeFormat('en-CA-u-ca-gregory', {
  timeZone: BOSS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'short',
});

const parts = (value) =>
  Object.fromEntries(
    bossInstantFormatter
      .formatToParts(new Date(value))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

/** Format a stored epoch instant in the owner's IANA timezone, including PST/PDT. */
export const formatBossInstant = (value, fallback = '—') => {
  if (value === null || value === undefined || value === '') return fallback;
  const instant = Number(value);
  if (!Number.isFinite(instant)) return fallback;
  const formatted = parts(instant);
  return `${formatted.year}-${formatted.month}-${formatted.day} ${formatted.hour}:${formatted.minute}:${formatted.second} ${formatted.timeZoneName}`;
};
