// Deciding what each legacy source record becomes.
//
// The rule is one sentence: a record becomes a `visitor_events` row only if it
// satisfies PAGE-event semantics on its own evidence. Nothing is inferred to
// make a record fit, and nothing is discarded for failing to.
//
// Every source record therefore has exactly one disposition:
//
//   imported  — it is a valid PAGE event; the archive row names the event id
//   archived  — it is not; the archive row names the reason
//
// The reasons are ordered, because a record can fail more than one test and a
// single reason has to be the honest headline. Structure before content:
// a line that would not parse is `malformed_record`, not `missing_path`.

import { createHash } from 'node:crypto';
import { isPublicPage } from '../../worker/lib/routes.js';
import { IMPORT_SOURCE } from './snapshot.js';
import {
  LEGACY_EVENT_SOURCE,
  parseTimestamp,
  splitCity,
  splitDevice,
  normalizePath,
  normalizeReferrer,
} from './parse.js';

export const EXCLUSION_REASONS = [
  'malformed_record',
  'missing_timestamp',
  'invalid_ip',
  'missing_path',
  'non_public_path',
];

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * Is this a storable address?
 *
 * Deliberately not a full RFC validator: the goal is to keep values out of
 * `visitor_events.ip_address` that are not addresses at all — the export
 * contains `2600:3c03:::`, which no parser accepts — while keeping the
 * prefix-truncated forms the tracker really wrote, such as `2603:8001:e7f0::`.
 */
export const isStorableAddress = (value) => {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (text.length < 2 || text.length > 45) return false;

  const v4 = IPV4.exec(text);
  if (v4) return v4.slice(1).every((part) => Number(part) <= 255 && String(Number(part)) === part);

  if (!text.includes(':')) return false;
  if (!/^[0-9a-fA-F:]+$/.test(text)) return false;
  // At most one `::`, and never a run of three or more colons.
  if (/:::/.test(text)) return false;
  if ((text.match(/::/g) ?? []).length > 1) return false;
  const groups = text.split(':').filter((part) => part !== '');
  return groups.length > 0 && groups.length <= 8 && groups.every((part) => part.length <= 4);
};

const sha = (...parts) => createHash('sha256').update(parts.join('')).digest('hex');

/**
 * The event id.
 *
 * Derived from content, so the same export always produces the same ids and a
 * rerun inserts nothing. The ordinal is what makes it total: the export
 * contains 25 records that are identical to another record in every field,
 * because the tracker double-wrote them. Those are real historical rows — the
 * old panel counted them — so they are preserved rather than collapsed, and
 * the ordinal distinguishes them without inventing a difference.
 */
export const eventId = (record, ordinal) =>
  `legacy-${sha(
    IMPORT_SOURCE,
    record.fields.ip ?? '',
    String(record.at ?? ''),
    record.path ?? '',
    record.userAgent ?? '',
    record.fields.device ?? '',
    String(ordinal),
  ).slice(0, 32)}`;

/** The archive id: one per line of one export, so a rerun collides by design. */
export const archiveId = (sourceLine) =>
  `legacy-src-${sha(IMPORT_SOURCE, String(sourceLine)).slice(0, 24)}`;

/**
 * Classify and shape one parsed record.
 *
 * `ordinals` is a Map carried across the whole export so identical records get
 * 1, 2, 3… in file order — deterministic because the file order is.
 */
export const mapRecord = (record, ordinals, importedAt) => {
  const fields = record.fields ?? {};
  const timestamp = parseTimestamp(fields.date);
  const path = normalizePath(fields.path);
  const { city, region } = splitCity(fields.city);
  const { deviceClass, browserFamily } = splitDevice(fields.device);
  const userAgent = typeof fields.userAgent === 'string' && fields.userAgent !== '-' ? fields.userAgent : null;
  const referrer = normalizeReferrer(fields.referrer);
  const country = typeof fields.country === 'string' && fields.country.trim() !== '' && fields.country !== '-'
    ? fields.country.trim()
    : null;

  const shaped = {
    id: archiveId(record.sourceLine),
    importSource: IMPORT_SOURCE,
    sourceLine: record.sourceLine,
    sourceFormat: record.format,
    sourceRecord: record.sourceRecord,
    redactions: record.redactions?.length ? JSON.stringify(record.redactions) : null,
    occurredAt: timestamp?.at ?? null,
    dateLocal: timestamp?.dateLocal ?? null,
    ipAddress: typeof fields.ip === 'string' ? fields.ip : null,
    country,
    region,
    city,
    path,
    referrerOrigin: referrer,
    userAgent,
    browserFamily,
    deviceClass,
    importedAt,
  };

  const archived = (reason) => ({
    ...shaped,
    disposition: 'archived',
    exclusionReason: reason,
    eventId: null,
    event: null,
  });

  if (record.format === 'unknown') return archived('malformed_record');
  if (!timestamp) return archived('missing_timestamp');
  if (!isStorableAddress(fields.ip)) return archived('invalid_ip');
  if (!path) return archived('missing_path');
  if (!isPublicPage(path)) return archived('non_public_path');

  const key = [fields.ip, timestamp.at, path, userAgent ?? '', fields.device ?? ''].join('');
  const ordinal = (ordinals.get(key) ?? 0) + 1;
  ordinals.set(key, ordinal);

  const id = eventId(
    { fields, at: timestamp.at, path, userAgent },
    ordinal,
  );

  return {
    ...shaped,
    disposition: 'imported',
    exclusionReason: null,
    eventId: id,
    event: {
      id,
      occurredAt: timestamp.at,
      dateLocal: timestamp.dateLocal,
      ipAddress: fields.ip,
      country,
      region,
      city,
      // The legacy tracker never recorded a Cloudflare colo. Null, not a guess.
      colo: null,
      path,
      // `referrer_origin` is NOT NULL in V3. The legacy panel wrote the literal
      // 'Direct' for an absent referrer, which is a value the source really
      // recorded rather than one invented here.
      referrerOrigin: referrer ?? 'Direct',
      userAgent: (userAgent ?? '').slice(0, 512),
      browserFamily: browserFamily ?? 'Unknown',
      deviceClass: deviceClass ?? 'unknown',
      // The legacy log stored no bot classification, and the panel's BOT-LIKE
      // label was computed at read time from counts relative to `now` — a view,
      // not a fact, and not reproducible. Imported history is honestly unknown.
      actorClass: 'unknown',
      classificationSource: 'none',
      sessionId: 'legacy-import',
      requestId: `${IMPORT_SOURCE}:${record.sourceLine}`,
      eventSource: LEGACY_EVENT_SOURCE,
    },
  };
};

/** Map a whole parsed export, in file order. */
export const mapExport = (records, importedAt = Date.now()) => {
  const ordinals = new Map();
  return records.map((record) => mapRecord(record, ordinals, importedAt));
};

/**
 * The reconciliation, recomputed from the records every time.
 *
 * Nothing here is carried forward from a previous run or a previous export.
 * The legacy log keeps growing, so any count that outlives the file it was
 * measured from is a claim about data nobody has looked at.
 *
 * The three totals are reported together because they are three different
 * questions, and reporting one invites the reader to assume the others:
 *
 *   sourceRecords  every line in the file
 *   panelVisible   what the old `/control-room` counted — it drops the
 *                  earliest format, so its total was never the file's total
 *   imported       what genuinely satisfies PAGE-event semantics
 *
 * `imported` is smaller than `panelVisible`, permanently and explainably: the
 * legacy tracker did not record a path for its first two generations, and a
 * page view whose page is unknown is not a page view.
 */
export const summarize = (mapped) => {
  const reasons = Object.fromEntries(EXCLUSION_REASONS.map((reason) => [reason, 0]));
  const formats = {};
  let imported = 0;
  let pathBearing = 0;

  for (const record of mapped) {
    formats[record.sourceFormat] = (formats[record.sourceFormat] ?? 0) + 1;
    if (record.path) pathBearing += 1;
    if (record.disposition === 'imported') imported += 1;
    else reasons[record.exclusionReason] += 1;
  }

  // Source fidelity: how much of the history is the tracker having written the
  // same visit twice. These rows are kept — the old panel counted them — so the
  // figure is reported rather than acted on.
  const seen = new Map();
  let duplicateRecords = 0;
  for (const record of mapped) {
    const key = [record.ipAddress, record.occurredAt, record.path, record.userAgent, record.sourceFormat].join('\u001f');
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count > 1) duplicateRecords += 1;
  }

  const instants = mapped.map((record) => record.occurredAt).filter((at) => at !== null);

  return {
    sourceRecords: mapped.length,
    panelVisible: mapped.filter((record) => record.sourceFormat !== 'dash' && record.sourceFormat !== 'unknown').length,
    pathBearing,
    imported,
    archived: mapped.length - imported,
    malformed: reasons.malformed_record,
    duplicateRecords,
    distinctRecords: seen.size,
    earliestAt: instants.length ? Math.min(...instants) : null,
    latestAt: instants.length ? Math.max(...instants) : null,
    reasons,
    formats,
  };
};
