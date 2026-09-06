-- Legacy analytics import: an explicit event source, and an archive for the
-- source records that cannot honestly become PAGE events.
--
-- Two things this migration refuses to do, and they are the design:
--
-- 1. It does not relax any PAGE-event rule so that more legacy records fit.
--    `visitor_events` means "a public page was viewed, and we know which page".
--    The legacy log stopped recording the path for 38% of its history, and no
--    sentinel can recover it. Those records are archived, not adapted.
-- 2. It does not make imported history look native. `event_source` is a real
--    column rather than an id prefix, so every read that needs the distinction
--    can express it in SQL, and the one that must — retention — does.
--
-- Forward-only and additive, as `docs/OPERATIONS.md` requires: nothing here
-- drops or narrows anything the previous artifact reads.

-- The source dimension. NOT NULL DEFAULT 'native' means every row written by
-- the ingestion path, past or future, is native without that path changing:
-- the existing INSERT does not name this column and does not have to.
ALTER TABLE visitor_events ADD COLUMN event_source TEXT NOT NULL DEFAULT 'native';

-- SQLite cannot add a CHECK to an existing table, so the allowed values are
-- enforced by the writers and asserted by tests rather than by the schema. The
-- values are exactly: 'native', 'legacy_panel'.
CREATE INDEX visitor_events_source_time_idx ON visitor_events (event_source, occurred_at DESC);

-- The archive.
--
-- Every source line is represented here exactly once, whether or not it became
-- a PAGE event: the imported ones carry `disposition = 'imported'` and the id
-- of the event they became, the rest carry the reason they could not. A source
-- record is never discarded for failing to fit — that would make the history
-- unauditable and the reconciliation unprovable.
--
-- `source_record` is the reconstructed line, redacted. Two things never land
-- here, per the import's privacy rules: `referrer_raw`, which carried full URLs
-- with Facebook click identifiers, and the query strings on paths, which
-- carried the same tokens. `redactions` names what was removed from each row,
-- so "this is not byte-identical to the file" is recorded rather than implied.
CREATE TABLE legacy_analytics_records (
  id                TEXT PRIMARY KEY,
  -- The logical stream, not the file. `import_source` stays constant across
  -- snapshots so that (import_source, source_line) keeps identifying the same
  -- source record; the snapshot a row arrived in is recorded separately.
  import_source     TEXT NOT NULL,
  snapshot_id       TEXT NOT NULL,
  source_line       INTEGER NOT NULL CHECK (source_line > 0),
  source_format     TEXT NOT NULL
                    CHECK (source_format IN ('dash','pipe','json-counter','json-event','unknown')),
  source_record     TEXT NOT NULL,
  redactions        TEXT,

  -- Parsed fields, as far as each record allowed. Null where the source had
  -- nothing to give; never a placeholder.
  occurred_at       INTEGER,
  date_local        TEXT,
  ip_address        TEXT,
  country           TEXT,
  region            TEXT,
  city              TEXT,
  path              TEXT,
  referrer_origin   TEXT,
  user_agent        TEXT,
  browser_family    TEXT,
  device_class      TEXT,

  disposition       TEXT NOT NULL CHECK (disposition IN ('imported','archived')),
  exclusion_reason  TEXT
                    CHECK (exclusion_reason IN (
                      'missing_path','non_public_path','invalid_ip',
                      'malformed_record','missing_timestamp'
                    )),
  event_id          TEXT,
  imported_at       INTEGER NOT NULL,

  -- An imported record names its event and no reason; an archived record names
  -- a reason and no event. Neither state can be half-recorded.
  CHECK ((disposition = 'imported' AND event_id IS NOT NULL AND exclusion_reason IS NULL)
      OR (disposition = 'archived' AND event_id IS NULL AND exclusion_reason IS NOT NULL)),

  -- One row per line of one export. This is what makes a rerun a no-op.
  UNIQUE (import_source, source_line)
);

CREATE INDEX legacy_records_disposition_idx ON legacy_analytics_records (disposition, exclusion_reason);
CREATE INDEX legacy_records_occurred_idx    ON legacy_analytics_records (occurred_at DESC);
CREATE INDEX legacy_records_event_idx       ON legacy_analytics_records (event_id);
CREATE INDEX legacy_records_snapshot_idx    ON legacy_analytics_records (snapshot_id);

-- The snapshots themselves.
--
-- The legacy log is a live file: production keeps appending to it, so any
-- export is a cutoff, never a completion. This table is what keeps that honest.
-- Each import records the exact bytes it read — a SHA-256 of the file, its size,
-- its record count and the newest timestamp inside it — so an imported row can
-- always be tied back to the snapshot it came from, and so "what happened after
-- the cutoff" is a question with a recorded answer rather than a guess.
--
-- A later export of the same, still-appending stream is a new snapshot. Its
-- earlier lines collide on (import_source, source_line) and are ignored; only
-- the lines appended since land, carrying the new snapshot_id. That is the
-- delta pass, and it needs no separate code path.
CREATE TABLE legacy_import_snapshots (
  id                TEXT PRIMARY KEY,
  import_source     TEXT NOT NULL,
  fingerprint       TEXT NOT NULL,
  file_name         TEXT,
  byte_size         INTEGER NOT NULL CHECK (byte_size >= 0),
  source_records    INTEGER NOT NULL CHECK (source_records >= 0),
  imported_events   INTEGER NOT NULL CHECK (imported_events >= 0),
  archived_records  INTEGER NOT NULL CHECK (archived_records >= 0),
  earliest_event_at INTEGER,
  latest_event_at   INTEGER,
  captured_at       INTEGER NOT NULL,
  UNIQUE (import_source, fingerprint)
);
