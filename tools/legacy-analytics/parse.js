// Parsing hakan.run's legacy visitor log.
//
// The file is not one format. Three generations of the PHP tracker wrote to it
// and the differences are not cosmetic — they change which fields exist:
//
//   dash          `ip - date - ua`                     no country, no path
//   pipe          `ip | date | country | city | device` no path, no referrer
//   json-counter  JSON with global/daily counters       no path, no referrer
//   json-event    JSON with path, referrer, ua_full     complete
//
// `run/get_log.php` accepts JSON lines and pipe lines with five or more
// fields, and silently drops anything else — which is why the dash records are
// invisible in the panel. This parser accepts all four and records which
// format each line was, so the three totals stay reconcilable rather than
// merely close.
//
// Timestamps are America/Los_Angeles wall clock: `run/log_hakanrun.php` sets
// that timezone before formatting. There is no offset in the file, and the
// export spans 2026-03-26 to 2026-09-05, which is entirely inside PDT — so
// UTC-7 throughout and no ambiguous repeated hour. Twelve records carry a
// 12-hour clock with a meridiem suffix; that reading is approved and applied.

export { IMPORT_SOURCE } from './snapshot.js';
export const LEGACY_EVENT_SOURCE = 'legacy_panel';

/** America/Los_Angeles is UTC-7 for every date in this export. */
export const LEGACY_UTC_OFFSET_MINUTES = -420;

const DASH = /^(?<ip>\S+) - (?<date>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) - (?<ua>.*)$/;
const ISO = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
const MERIDIEM = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (AM|PM)$/;

export class ParseProblem extends Error {
  constructor(reason, line, detail) {
    super(`line ${line}: ${reason}${detail ? ` (${detail})` : ''}`);
    this.name = 'ParseProblem';
    this.reason = reason;
    this.line = line;
  }
}

/**
 * Parse a legacy timestamp into epoch milliseconds and its local day.
 *
 * Returns null rather than throwing, so a bad timestamp becomes an archived
 * record with a reason instead of aborting the whole import.
 */
export const parseTimestamp = (value) => {
  if (typeof value !== 'string') return null;
  let text = value.trim();
  let shift = 0;

  const meridiem = MERIDIEM.exec(text);
  if (meridiem) {
    text = meridiem[1];
    const hour = Number(text.slice(11, 13));
    if (meridiem[2] === 'PM' && hour < 12) shift = 12;
    if (meridiem[2] === 'AM' && hour === 12) shift = -12;
  }

  const iso = ISO.exec(text);
  if (!iso) return null;

  const [, y, mo, d, h, mi, s] = iso.map(Number);
  const hour = h + shift;
  if (hour < 0 || hour > 23) return null;

  // Wall clock at UTC-7. Date.UTC then subtract the offset.
  const at = Date.UTC(y, mo - 1, d, hour, mi, s) - LEGACY_UTC_OFFSET_MINUTES * 60_000;
  // The local day is the date part as written; no conversion, because the
  // source already recorded America/Los_Angeles and V3 keys days the same way.
  const dateLocal = `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return { at, dateLocal, meridiem: Boolean(meridiem) };
};

/** Split `"Santa Ana, CA"` into city and region. A bare city keeps a null region. */
export const splitCity = (value) => {
  if (typeof value !== 'string' || value.trim() === '' || value === '-') {
    return { city: null, region: null };
  }
  const match = /^(.*),\s*([A-Za-z0-9]{1,3})$/.exec(value.trim());
  if (!match) return { city: value.trim(), region: null };
  return { city: match[1].trim(), region: match[2].trim() };
};

/**
 * Split `"Desktop / Chrome 150"` into a V3 device class and browser family.
 *
 * The legacy tracker only ever wrote Desktop or Mobile, so `tablet` is a class
 * this history can never populate. Version numbers are dropped: V3's
 * `browser_family` is a family, and `Chrome 150` would fragment it into
 * dozens of values that mean the same browser.
 */
export const splitDevice = (value) => {
  if (typeof value !== 'string' || value.trim() === '' || value === '-') {
    return { deviceClass: null, browserFamily: null };
  }
  const [rawClass, rawFamily] = value.split('/');
  const cls = (rawClass ?? '').trim().toLowerCase();
  const deviceClass = ['desktop', 'mobile', 'tablet'].includes(cls) ? cls : 'other';
  const family = (rawFamily ?? '').trim().split(/\s+/)[0] || null;
  return { deviceClass, browserFamily: family };
};

/** Strip the query and fragment, collapse slashes, drop a trailing slash. */
export const normalizePath = (value) => {
  if (typeof value !== 'string' || value === '' || value === '-') return null;
  const [withoutFragment] = value.split('#');
  const [withoutQuery] = withoutFragment.split('?');
  const collapsed = withoutQuery.replace(/\/{2,}/g, '/');
  if (collapsed === '') return null;
  if (collapsed.length > 1 && collapsed.endsWith('/')) return collapsed.slice(0, -1) || '/';
  return collapsed;
};

/** A referrer label the legacy panel already normalised, or null. */
export const normalizeReferrer = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '-') return null;
  return trimmed.slice(0, 255);
};

/**
 * Parse one line into a source record.
 *
 * Never throws for content reasons: an unrecognisable line becomes a record of
 * format `unknown`, which the mapper archives with `malformed_record`. A line
 * that cannot be parsed must be visible, not absent.
 */
export const parseLine = (raw, lineNumber) => {
  const text = raw.trim();
  const base = { sourceLine: lineNumber, redactions: [] };

  if (text.startsWith('{')) {
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return { ...base, format: 'unknown', fields: {}, sourceRecord: text };
    }
    const isCounter = 'global' in payload || 'daily' in payload;
    const fields = {
      ip: payload.ip,
      date: payload.date,
      country: payload.country,
      city: payload.city,
      device: payload.device,
      userAgent: payload.ua_full,
      referrer: payload.referrer,
      path: payload.path,
    };
    // referrer_raw carried full URLs with click identifiers. It is dropped
    // here, before anything can persist it.
    const redactions = [];
    if ('referrer_raw' in payload) redactions.push('referrer_raw');
    if (typeof payload.path === 'string' && /[?#]/.test(payload.path)) redactions.push('path_query');
    return {
      ...base,
      format: isCounter ? 'json-counter' : 'json-event',
      fields,
      redactions,
      sourceRecord: JSON.stringify({
        ip: payload.ip ?? null,
        date: payload.date ?? null,
        country: payload.country ?? null,
        city: payload.city ?? null,
        device: payload.device ?? null,
        ua_full: payload.ua_full ?? null,
        referrer: payload.referrer ?? null,
        path: normalizePath(payload.path),
      }),
    };
  }

  if (text.includes(' | ')) {
    const parts = text.split(' | ');
    if (parts.length < 5) return { ...base, format: 'unknown', fields: {}, sourceRecord: text };
    // `get_log.php` reads a seven-field variant as GLOBAL|DAILY|IP|DATE|...;
    // this export contains none, but the offset is honoured so a wider file
    // parses correctly rather than silently misaligning every column.
    const offset = parts.length >= 7 ? 2 : 0;
    const [ip, date, country, city, device] = parts.slice(offset, offset + 5);
    return {
      ...base,
      format: 'pipe',
      fields: { ip, date, country, city, device },
      sourceRecord: text,
    };
  }

  const dash = DASH.exec(text);
  if (dash) {
    return {
      ...base,
      format: 'dash',
      fields: { ip: dash.groups.ip, date: dash.groups.date, userAgent: dash.groups.ua },
      sourceRecord: text,
    };
  }

  return { ...base, format: 'unknown', fields: {}, sourceRecord: text };
};

/** Parse an export into source records, one per non-empty line, in file order. */
export const parseExport = (text) => {
  const records = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (const [index, line] of lines.entries()) {
    if (line.trim() === '') continue;
    records.push(parseLine(line, index + 1));
  }
  return records;
};
