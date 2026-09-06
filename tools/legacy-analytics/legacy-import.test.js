// The legacy analytics import: parsing, mapping, and what must not happen.
//
// Everything runs against a sanitized fixture — RFC 5737 / RFC 3849
// documentation addresses, invented user agents — and against the real
// migrations in an in-memory database. The production export is never
// committed, so a test that needed it would be a test nobody else could run.

import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseExport,
  parseLine,
  parseTimestamp,
  splitCity,
  splitDevice,
  normalizePath,
  LEGACY_UTC_OFFSET_MINUTES,
  IMPORT_SOURCE,
} from './parse.js';
import { mapExport, summarize, isStorableAddress, archiveId, EXCLUSION_REASONS } from './map.js';
import { describeSnapshot, fingerprintOf } from './snapshot.js';
import { importStatements, importSql } from './statements.js';
import { oldestEventQuery, totalEventsQuery, eventsBySourceQuery, NATIVE_SOURCE, LEGACY_SOURCE } from '../../worker/analytics/queries.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const fixture = () => readFileSync(path.join(here, 'fixtures/sample-panel-log.txt'), 'utf8');

const openDb = () => {
  const db = new DatabaseSync(':memory:');
  const dir = path.join(root, 'migrations/analytics');
  for (const file of readdirSync(dir).filter((n) => n.endsWith('.sql')).sort()) {
    db.exec(readFileSync(path.join(dir, file), 'utf8'));
  }
  return db;
};

const snapshotOf = (mapped, contents = fixture(), capturedAt = 1_757_000_000_000) =>
  describeSnapshot({ contents, fileName: 'sample-panel-log.txt', mapped, capturedAt });

const apply = (db, mapped, contents = fixture()) => {
  const snapshot = snapshotOf(mapped, contents);
  for (const { sql, params } of importStatements(mapped, snapshot)) db.prepare(sql).run(...params);
  return snapshot;
};

const mapped = (at = 1_757_000_000_000) => mapExport(parseExport(fixture()), at);

// --- All four formats parse -------------------------------------------------

test('all four legacy formats are recognised, none silently dropped', () => {
  const formats = {};
  for (const record of parseExport(fixture())) {
    formats[record.format] = (formats[record.format] ?? 0) + 1;
  }
  assert.deepEqual(formats, { dash: 1, pipe: 5, 'json-counter': 1, 'json-event': 5, unknown: 1 });
});

test('the seven-field pipe variant reads its columns at the right offset', () => {
  // `get_log.php` supports GLOBAL|DAILY|IP|DATE|COUNTRY|CITY|DEVICE. This export
  // has none, but a wider file must not misalign every column by two.
  const record = parseLine('7 | 3 | 198.51.100.1 | 2026-01-01 00:00:00 | France | Paris, IDF | Desktop / Chrome 100', 1);
  assert.equal(record.format, 'pipe');
  assert.equal(record.fields.ip, '198.51.100.1');
  assert.equal(record.fields.country, 'France');
});

test('an unrecognisable line becomes a record, not an absence', () => {
  const record = parseLine('nonsense', 42);
  assert.equal(record.format, 'unknown');
  assert.equal(record.sourceLine, 42);
});

// --- Timestamps -------------------------------------------------------------

test('a 12-hour timestamp is read as 12-hour', () => {
  const pm = parseTimestamp('2026-04-28 10:37:42 PM');
  const iso = parseTimestamp('2026-04-28 22:37:42');
  assert.equal(pm.at, iso.at);
  assert.equal(pm.meridiem, true);
  assert.equal(pm.dateLocal, '2026-04-28');
});

test('midnight and noon do not swap under the meridiem rule', () => {
  assert.equal(parseTimestamp('2026-04-28 12:30:00 AM').at, parseTimestamp('2026-04-28 00:30:00').at);
  assert.equal(parseTimestamp('2026-04-28 12:30:00 PM').at, parseTimestamp('2026-04-28 12:30:00').at);
});

test('timestamps are America/Los_Angeles wall clock, converted at UTC-7', () => {
  const { at, dateLocal } = parseTimestamp('2026-06-01 09:00:00');
  assert.equal(new Date(at).toISOString(), '2026-06-01T16:00:00.000Z');
  assert.equal(LEGACY_UTC_OFFSET_MINUTES, -420);
  // The local day is the date as written: no conversion, because V3 keys days
  // in the same timezone the legacy tracker recorded.
  assert.equal(dateLocal, '2026-06-01');
});

test('an unparseable timestamp is null rather than an exception', () => {
  for (const value of ['', 'yesterday', '2026-13-45 99:99:99', undefined]) {
    assert.equal(parseTimestamp(value), null);
  }
});

// --- Addresses --------------------------------------------------------------

test('IPv4, full IPv6 and prefix-truncated IPv6 are all storable', () => {
  for (const value of ['198.51.100.10', '2001:db8:abcd:1234:5678:90ab:cdef:1', '2001:db8:1234::']) {
    assert.ok(isStorableAddress(value), value);
  }
});

test('the malformed address in the export is refused', () => {
  assert.equal(isStorableAddress('2001:db8:3c03:::'), false);
  assert.equal(isStorableAddress('999.1.1.1'), false);
  assert.equal(isStorableAddress('not-an-ip'), false);
  assert.equal(isStorableAddress(''), false);
});

test('a record with an unusable address is archived, not imported', () => {
  const record = mapped().find((r) => r.ipAddress === '2001:db8:3c03:::');
  assert.equal(record.disposition, 'archived');
  assert.equal(record.exclusionReason, 'invalid_ip');
  assert.equal(record.ipAddress, '2001:db8:3c03:::', 'the raw value is preserved in the archive');
  assert.equal(record.event, null);
});

// --- Path rules -------------------------------------------------------------

test('a record with no path is archived as missing_path, never given one', () => {
  const pathless = mapped().filter((r) => r.exclusionReason === 'missing_path');
  assert.equal(pathless.length, 7, 'one dash, five pipe, one json-counter');
  for (const record of pathless) {
    assert.equal(record.path, null);
    assert.equal(record.event, null);
  }
});

test('a non-public path is archived rather than counted as a page view', () => {
  const record = mapped().find((r) => r.exclusionReason === 'non_public_path');
  assert.equal(record.path, '/boss');
  assert.equal(record.event, null);
});

test('query strings are stripped, and the tracking token never reaches either table', () => {
  const record = mapped().find((r) => r.sourceRecord.includes('Instagram'));
  assert.equal(record.path, '/');
  assert.equal(record.disposition, 'imported');
  assert.ok(!record.sourceRecord.includes('fbclid'), 'the archive must not carry the token');
  assert.ok(!record.sourceRecord.includes('EXAMPLE_TRACKING_TOKEN_DO_NOT_PERSIST'));
  assert.deepEqual(JSON.parse(record.redactions).sort(), ['path_query', 'referrer_raw']);
});

test('referrer_raw values are dropped from every record', () => {
  const sql = importSql(mapped(), snapshotOf(mapped()));
  // The word survives, in the `redactions` list, and that is the point: the
  // record says what was removed. What must not survive is the value.
  assert.ok(!/l\.instagram\.com/.test(sql), 'the full referrer URL is not persisted');
  assert.ok(!/https:\/\/hakan\.run\//.test(sql), 'nor any other referrer URL');
  assert.ok(/'Instagram'/.test(sql), 'the normalised origin is');
  assert.ok(/"referrer_raw"/.test(sql), 'and the removal is recorded rather than silent');
});

test('normalizePath leaves a public path alone and refuses an empty one', () => {
  assert.equal(normalizePath('/contact/'), '/contact');
  assert.equal(normalizePath('//project//x'), '/project/x');
  assert.equal(normalizePath('-'), null);
  assert.equal(normalizePath(undefined), null);
});

// --- City / device parsing --------------------------------------------------

test('a city with a region suffix splits; one without keeps a null region', () => {
  assert.deepEqual(splitCity('Santa Ana, CA'), { city: 'Santa Ana', region: 'CA' });
  assert.deepEqual(splitCity('Warsaw, 14'), { city: 'Warsaw', region: '14' });
  assert.deepEqual(splitCity('Auckland'), { city: 'Auckland', region: null });
  assert.deepEqual(splitCity('-'), { city: null, region: null });
});

test('device labels split into a V3 class and a browser family without versions', () => {
  assert.deepEqual(splitDevice('Desktop / Chrome 150'), { deviceClass: 'desktop', browserFamily: 'Chrome' });
  assert.deepEqual(splitDevice('Mobile / Safari'), { deviceClass: 'mobile', browserFamily: 'Safari' });
  // The legacy tracker never wrote a class V3 does not know; anything else is
  // 'other' rather than a guess.
  assert.deepEqual(splitDevice('Mozilla/5.0 (X11)'), { deviceClass: 'other', browserFamily: '5.0' });
  assert.deepEqual(splitDevice('-'), { deviceClass: null, browserFamily: null });
});

test('a record with no device label still imports, with honest unknowns', () => {
  const record = mapped().find((r) => r.disposition === 'imported' && r.deviceClass === null);
  assert.equal(record, undefined, 'every importable fixture record has a device label');
});

// --- Duplicates and idempotency ---------------------------------------------

test('historically duplicated source rows are both preserved', () => {
  // The tracker double-wrote 25 rows. The old panel counted them, so imported
  // totals have to remain explainable against the old source.
  const twins = mapped().filter((r) => r.ipAddress === '2001:db8:1234::');
  assert.equal(twins.length, 2);
  assert.notEqual(twins[0].id, twins[1].id, 'each source line has its own archive row');
});

test('the same export produces the same ids every time', () => {
  const a = mapped(1);
  const b = mapped(999_999);
  assert.deepEqual(a.map((r) => r.id), b.map((r) => r.id));
  assert.deepEqual(a.map((r) => r.eventId), b.map((r) => r.eventId));
});

test('rerunning the import writes nothing the second time', () => {
  const db = openDb();
  const plan = mapped();

  apply(db, plan);
  const after = () => ({
    events: db.prepare('SELECT COUNT(*) AS n FROM visitor_events').get().n,
    archive: db.prepare('SELECT COUNT(*) AS n FROM legacy_analytics_records').get().n,
  });
  const first = after();

  apply(db, mapExport(parseExport(fixture()), 42));
  assert.deepEqual(after(), first, 'a rerun must add nothing');
});

test('every source line reaches the archive exactly once', () => {
  const db = openDb();
  apply(db, mapped());
  const rows = db.prepare('SELECT source_line, COUNT(*) AS n FROM legacy_analytics_records GROUP BY source_line HAVING n > 1').all();
  assert.deepEqual(rows, []);
  assert.equal(
    db.prepare('SELECT COUNT(*) AS n FROM legacy_analytics_records').get().n,
    parseExport(fixture()).length,
  );
});

test('an archive row is either imported with an event or archived with a reason', () => {
  const db = openDb();
  apply(db, mapped());
  const broken = db.prepare(
    `SELECT id FROM legacy_analytics_records
     WHERE (disposition = 'imported' AND (event_id IS NULL OR exclusion_reason IS NOT NULL))
        OR (disposition = 'archived' AND (event_id IS NOT NULL OR exclusion_reason IS NULL))`,
  ).all();
  assert.deepEqual(broken, []);
});

test('every imported archive row points at an event that exists', () => {
  const db = openDb();
  apply(db, mapped());
  const orphans = db.prepare(
    `SELECT a.id FROM legacy_analytics_records a
     LEFT JOIN visitor_events e ON e.id = a.event_id
     WHERE a.disposition = 'imported' AND e.id IS NULL`,
  ).all();
  assert.deepEqual(orphans, []);
});

// --- Event source separation ------------------------------------------------

test('imported events carry the legacy source, and nothing else does', () => {
  const db = openDb();
  apply(db, mapped());
  const sources = db.prepare('SELECT event_source, COUNT(*) AS n FROM visitor_events GROUP BY 1').all();
  assert.deepEqual(sources.map((row) => ({ ...row })), [{ event_source: 'legacy_panel', n: 3 }]);
});

test('a native insert that names no source is still native', () => {
  // The ingestion path does not mention event_source and must not have to.
  const db = openDb();
  db.prepare(
    `INSERT INTO visitor_events
      (id, occurred_at, date_local, ip_address, country, region, city, colo, path,
       referrer_origin, user_agent, browser_family, device_class, actor_class,
       classification_source, session_id, request_id)
     VALUES ('n1', 1757000000000, '2026-09-04', '198.51.100.1', 'US', 'CA', 'Irvine', 'LAX', '/',
             'direct', 'ua', 'Chrome', 'desktop', 'human-likely', 'none', 's1', NULL)`,
  ).run();
  assert.equal(db.prepare('SELECT event_source FROM visitor_events WHERE id = ?').get('n1').event_source, NATIVE_SOURCE);
});

test('imported events are readable through the existing V3 read path', () => {
  const db = openDb();
  apply(db, mapped());
  const rows = db.prepare(
    'SELECT path, country, device_class, actor_class FROM visitor_events ORDER BY occurred_at',
  ).all();
  // `/contact` is absent on purpose: that record carried an unusable address
  // and was archived, not imported.
  assert.deepEqual(rows.map((r) => r.path), ['/', '/', '/project/full-stack-development']);
  assert.ok(rows.every((r) => r.actor_class === 'unknown'), 'no bot classification is invented');
});

// --- Retention --------------------------------------------------------------

test('163-day-old legacy history does not age the native retention figure', () => {
  const db = openDb();
  apply(db, mapped());
  db.prepare(
    `INSERT INTO visitor_events
      (id, occurred_at, date_local, ip_address, country, region, city, colo, path,
       referrer_origin, user_agent, browser_family, device_class, actor_class,
       classification_source, session_id, request_id)
     VALUES ('n1', 1757000000000, '2026-09-04', '198.51.100.1', 'US', 'CA', 'Irvine', 'LAX', '/',
             'direct', 'ua', 'Chrome', 'desktop', 'human-likely', 'none', 's1', NULL)`,
  ).run();

  const q = oldestEventQuery(NATIVE_SOURCE);
  const native = db.prepare(q.sql).get(...q.params);
  assert.equal(native.oldest_day, '2026-09-04', 'native retention sees only native events');

  const l = oldestEventQuery(LEGACY_SOURCE);
  assert.equal(db.prepare(l.sql).get(...l.params).oldest_day, '2026-05-17');

  const t = totalEventsQuery(NATIVE_SOURCE);
  assert.equal(db.prepare(t.sql).get(...t.params).value, 1, 'the native count excludes imported history');
});

test('every source with rows is reported, so a new one cannot hide', () => {
  const db = openDb();
  apply(db, mapped());
  const q = eventsBySourceQuery();
  assert.deepEqual(
    db.prepare(q.sql).all(...q.params).map((r) => r.source),
    ['legacy_panel'],
  );
});

// --- Coverage ledger --------------------------------------------------------

test('the import writes nothing to the coverage ledger or the aggregates', () => {
  const db = openDb();
  apply(db, mapped());
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM analytics_coverage').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM analytics_daily').get().n, 0);

  const sql = importSql(mapped(), snapshotOf(mapped()));
  assert.ok(!/analytics_coverage/i.test(sql), 'no statement may claim coverage');
  assert.ok(!/analytics_daily/i.test(sql), 'imported history is raw, uncovered history');
});

test('only the two intended tables are ever written', () => {
  const tables = new Set(
    importStatements(mapped(), snapshotOf(mapped())).map(({ sql }) => /INSERT OR IGNORE INTO (\w+)/.exec(sql)[1]),
  );
  assert.deepEqual([...tables].sort(), ['legacy_analytics_records', 'legacy_import_snapshots', 'visitor_events']);
});

// --- Reconciliation ---------------------------------------------------------

test('the three totals are reported and add up', () => {
  const summary = summarize(mapped());
  assert.equal(summary.sourceRecords, 13);
  assert.equal(summary.panelVisible, 11, 'the dash record and the unparseable line are invisible to the old panel');
  assert.equal(summary.imported, 3);
  assert.deepEqual(summary.reasons, {
    malformed_record: 1,
    missing_timestamp: 0,
    invalid_ip: 1,
    missing_path: 7,
    non_public_path: 1,
  });
  assert.equal(summary.imported + summary.archived, summary.sourceRecords);
  assert.equal(
    Object.values(summary.reasons).reduce((total, n) => total + n, 0),
    summary.archived,
    'every archived record has exactly one reason',
  );
});

test('the reason vocabulary matches the schema', () => {
  const schema = readFileSync(path.join(root, 'migrations/analytics/0002_legacy_import.sql'), 'utf8');
  for (const reason of EXCLUSION_REASONS) {
    assert.ok(schema.includes(`'${reason}'`), `${reason} must be allowed by the CHECK`);
  }
});

test('archive ids are deterministic and derived from the source line', () => {
  assert.equal(archiveId(7), archiveId(7));
  assert.notEqual(archiveId(7), archiveId(8));
  assert.ok(archiveId(7).startsWith('legacy-src-'));
  assert.equal(IMPORT_SOURCE, 'hakanrun_panel_log');
});

// ---------------------------------------------------------------------------
// Snapshots: the source log is live, so an export is a cutoff, not a total.
// ---------------------------------------------------------------------------

test('a snapshot is identified by its bytes, not by its name or its date', () => {
  const a = fingerprintOf('same bytes');
  const b = fingerprintOf(Buffer.from('same bytes', 'utf8'));
  assert.equal(a.fingerprint, b.fingerprint);
  assert.equal(a.snapshotId, b.snapshotId);
  assert.notEqual(fingerprintOf('same bytes').fingerprint, fingerprintOf('same bytes ').fingerprint);
  assert.equal(a.byteSize, 10);
});

test('the snapshot records the cutoff, and the cutoff is the newest imported event', () => {
  const plan = mapped();
  const snapshot = snapshotOf(plan);
  const instants = plan.filter((r) => r.event).map((r) => r.occurredAt);
  assert.equal(snapshot.latestEventAt, Math.max(...instants));
  assert.equal(snapshot.earliestEventAt, Math.min(...instants));
  assert.equal(snapshot.sourceRecords, plan.length);
  assert.equal(snapshot.importedEvents + snapshot.archivedRecords, plan.length);
});

test('the snapshot row is written, and every archive row points at it', () => {
  const db = openDb();
  const snapshot = apply(db, mapped());

  const stored = db.prepare('SELECT * FROM legacy_import_snapshots').all();
  assert.equal(stored.length, 1);
  assert.equal(stored[0].fingerprint, snapshot.fingerprint);
  assert.equal(stored[0].file_name, 'sample-panel-log.txt');

  const orphans = db.prepare(
    `SELECT a.id FROM legacy_analytics_records a
     LEFT JOIN legacy_import_snapshots s ON s.id = a.snapshot_id
     WHERE s.id IS NULL`,
  ).all();
  assert.deepEqual(orphans, [], 'an imported row must always name the snapshot it came from');
});

test('a later export of the same growing log adds only what was appended', () => {
  // The delta pass, which is the same code path as the first import. Production
  // keeps writing, so this is the normal case rather than an edge case.
  const db = openDb();
  const first = fixture();
  apply(db, mapExport(parseExport(first), 1), first);

  const before = {
    events: db.prepare('SELECT COUNT(*) AS n FROM visitor_events').get().n,
    archive: db.prepare('SELECT COUNT(*) AS n FROM legacy_analytics_records').get().n,
  };

  const grown = `${first}{"ip":"198.51.100.99","date":"2026-09-06 10:00:00","country":"United States","city":"Irvine, CA","device":"Desktop / Chrome 152","ua_full":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36","referrer":"Direct","referrer_raw":"-","path":"/contact"}\n`;
  apply(db, mapExport(parseExport(grown), 2), grown);

  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM visitor_events').get().n, before.events + 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM legacy_analytics_records').get().n, before.archive + 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM legacy_import_snapshots').get().n, 2, 'two snapshots, both recorded');

  const added = db.prepare('SELECT path, event_source FROM visitor_events ORDER BY occurred_at DESC LIMIT 1').get();
  assert.equal(added.path, '/contact');
  assert.equal(added.event_source, 'legacy_panel');
});

test('re-importing an identical export is a no-op, snapshot row included', () => {
  const db = openDb();
  apply(db, mapped());
  apply(db, mapExport(parseExport(fixture()), 999));
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM legacy_import_snapshots').get().n, 1);
});

// --- Reconciliation is recomputed, never remembered --------------------------

test('the summary is derived from the records it is given, with nothing compiled in', () => {
  const full = summarize(mapped());
  const half = summarize(mapped().slice(0, 8));
  assert.notEqual(full.sourceRecords, half.sourceRecords);
  assert.equal(half.sourceRecords, 8);
  assert.equal(half.imported + half.archived, 8);
});

test('the summary reports path-bearing separately from importable', () => {
  const summary = summarize(mapped());
  // These are different questions, and the difference is the whole point: a
  // record can carry a path and still not be a public page view.
  assert.equal(summary.pathBearing, 5);
  assert.equal(summary.imported, 3);
  assert.equal(summary.pathBearing - summary.imported, 2, 'one /boss, one unusable address');
});

test('duplicate double-writes are counted and kept, not removed', () => {
  const summary = summarize(mapped());
  assert.equal(summary.duplicateRecords, 1, 'the fixture has one repeated pair');
  assert.equal(summary.distinctRecords, summary.sourceRecords - summary.duplicateRecords);
});

test('the earliest and latest timestamps come from the records', () => {
  const summary = summarize(mapped());
  assert.equal(new Date(summary.earliestAt).toISOString(), '2026-03-27T03:59:28.000Z');
  assert.equal(new Date(summary.latestAt).toISOString(), '2026-06-04T16:00:00.000Z');
});
