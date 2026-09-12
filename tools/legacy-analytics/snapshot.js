// A snapshot of the legacy log, and why the file identity matters.
//
// The legacy visitor log is a live, append-only file: production keeps writing
// to it, so every export is a cutoff rather than a completion. Nothing about an
// import is "final" — the honest unit is "these exact bytes, read at this
// moment, whose newest record is this one".
//
// So a snapshot is identified by its content, not by its name or its date. The
// fingerprint is a SHA-256 of the file exactly as read. Two exports with the
// same bytes are the same snapshot and import once; an export taken a minute
// later with one more line is a different snapshot, and only the new line is
// new.
//
// Nothing here counts anything the caller told it. Every figure is recomputed
// from the file on every run, because a count carried forward from an earlier
// export is a claim about data this run has not seen.

import { createHash } from 'node:crypto';
import { currentClassification } from './classification.js';

export const IMPORT_SOURCE = 'hakanrun_panel_log';

/** SHA-256 of the exact bytes, and the derived snapshot id. */
export const fingerprintOf = (contents) => {
  const bytes = Buffer.isBuffer(contents) ? contents : Buffer.from(contents, 'utf8');
  const fingerprint = createHash('sha256').update(bytes).digest('hex');
  return { fingerprint, byteSize: bytes.byteLength, snapshotId: `snap-${fingerprint.slice(0, 24)}` };
};

/**
 * Describe a snapshot from its bytes and its mapped records.
 *
 * `earliest`/`latest` are the extremes of the *importable* events, which is what
 * a later delta pass needs to reason about: the cutoff that matters is the
 * newest record this snapshot actually carried into the analytics store.
 */
export const describeSnapshot = ({ contents, fileName = null, mapped, capturedAt }) => {
  const { fingerprint, byteSize, snapshotId } = fingerprintOf(contents);
  const withEvents = mapped.filter((record) => record.event);
  const instants = withEvents.map((record) => record.occurredAt);

  return {
    id: snapshotId,
    importSource: IMPORT_SOURCE,
    fingerprint,
    fileName,
    byteSize,
    sourceRecords: mapped.length,
    importedEvents: withEvents.length,
    archivedRecords: mapped.length - withEvents.length,
    earliestEventAt: instants.length ? Math.min(...instants) : null,
    latestEventAt: instants.length ? Math.max(...instants) : null,
    capturedAt,
    classification: currentClassification(),
  };
};

/** Validate exact source bytes before parsing or producing any SQL. */
export const verifyPrefix = (contents, evidence) => {
  if (!evidence || evidence.importSource !== IMPORT_SOURCE
    || !Number.isSafeInteger(evidence.byteSize) || evidence.byteSize <= 0
    || !/^[0-9a-f]{64}$/.test(evidence.fingerprint ?? ''))
    throw new Error('Invalid previous snapshot length, fingerprint or import source');
  const bytes = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  if (bytes.length < evidence.byteSize) throw new Error('Full log is shorter than the previously imported prefix');
  const prefix = bytes.subarray(0, evidence.byteSize);
  const actual = fingerprintOf(prefix);
  if (actual.fingerprint !== evidence.fingerprint)
    throw new Error(`Source prefix mismatch: expected ${evidence.fingerprint}, received ${actual.fingerprint}`);
  // A prefix ending inside a record would change its old source-line identity.
  if (bytes.length > prefix.length && prefix.at(-1) !== 10 && bytes[prefix.length] !== 10
    && !(bytes[prefix.length] === 13 && bytes[prefix.length + 1] === 10))
    throw new Error('Append must start at a complete source-line boundary');
  return prefix;
};
