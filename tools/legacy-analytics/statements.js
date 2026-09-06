// Turning a mapped export into statements for ANALYTICS_DB.
//
// Two inserts per source record at most: the archive row always, and the event
// row when the record earned one. Both use INSERT OR IGNORE against a key
// derived from the source, which is the whole idempotency story — rerunning the
// same export inserts nothing, because every id and every (import_source,
// source_line) pair is already there.
//
// Nothing here connects to a database. Producing the statements and running
// them are separate acts, and only the first lives in this repository.

import { LEGACY_EVENT_SOURCE } from './parse.js';

export const eventStatement = (event) => ({
  sql: `INSERT OR IGNORE INTO visitor_events
          (id, occurred_at, date_local, ip_address, country, region, city, colo, path,
           referrer_origin, user_agent, browser_family, device_class, actor_class,
           classification_source, session_id, request_id, event_source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  params: [
    event.id, event.occurredAt, event.dateLocal, event.ipAddress, event.country,
    event.region, event.city, event.colo, event.path, event.referrerOrigin,
    event.userAgent, event.browserFamily, event.deviceClass, event.actorClass,
    event.classificationSource, event.sessionId, event.requestId, event.eventSource,
  ],
});

export const archiveStatement = (record, snapshotId) => ({
  sql: `INSERT OR IGNORE INTO legacy_analytics_records
          (id, import_source, snapshot_id, source_line, source_format, source_record, redactions,
           occurred_at, date_local, ip_address, country, region, city, path,
           referrer_origin, user_agent, browser_family, device_class,
           disposition, exclusion_reason, event_id, imported_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  params: [
    record.id, record.importSource, snapshotId, record.sourceLine, record.sourceFormat,
    record.sourceRecord, record.redactions, record.occurredAt, record.dateLocal,
    record.ipAddress, record.country, record.region, record.city, record.path,
    record.referrerOrigin, record.userAgent, record.browserFamily, record.deviceClass,
    record.disposition, record.exclusionReason, record.eventId, record.importedAt,
  ],
});

/**
 * The snapshot row: which exact bytes this import read.
 *
 * Written first, so an interrupted import still records what it was reading.
 * Every archive row points at it, which is what ties an imported dataset back
 * to its source file long after the file itself is gone.
 */
export const snapshotStatement = (snapshot) => ({
  sql: `INSERT OR IGNORE INTO legacy_import_snapshots
          (id, import_source, fingerprint, file_name, byte_size, source_records,
           imported_events, archived_records, earliest_event_at, latest_event_at, captured_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  params: [
    snapshot.id, snapshot.importSource, snapshot.fingerprint, snapshot.fileName,
    snapshot.byteSize, snapshot.sourceRecords, snapshot.importedEvents,
    snapshot.archivedRecords, snapshot.earliestEventAt, snapshot.latestEventAt,
    snapshot.capturedAt,
  ],
});

/**
 * All statements for a mapped export, archive first.
 *
 * Archive before event, on purpose: if an import is interrupted, a source line
 * that produced an event always has its archive row too. The reverse order
 * could leave an event with no provenance, which is the state this design
 * exists to prevent.
 */
export const importStatements = (mapped, snapshot) => {
  const statements = [snapshotStatement(snapshot)];
  for (const record of mapped) {
    statements.push(archiveStatement(record, snapshot.id));
    if (record.event) statements.push(eventStatement(record.event));
  }
  return statements;
};

const quote = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
};

/** The same statements as a reviewable script. */
export const importSql = (mapped, snapshot) =>
  importStatements(mapped, snapshot)
    .map(({ sql, params }) => {
      let index = -1;
      return `${sql.replace(/\?/g, () => {
        index += 1;
        return quote(params[index]);
      })};`;
    })
    .join('\n\n');

export { LEGACY_EVENT_SOURCE };
