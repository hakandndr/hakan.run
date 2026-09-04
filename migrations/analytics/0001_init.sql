-- ANALYTICS_DB — Analytics V3 from the first migration.
--
-- Three deliberate properties, adopted from the proven reference design:
--
-- 1. Raw detail is never purged automatically. There is no expires_at column
--    and no scheduled delete. Scheduled work aggregates only. Raw rows survive
--    until an explicit, audited owner deletion.
-- 2. Daily aggregates carry an aggregate_version so rows written under one set
--    of collection semantics can never be silently read as another.
-- 3. Aggregate reads are authorised only by the coverage ledger. Coverage is
--    never inferred from MIN/MAX, row counts, or the presence of a date key.

-- Raw PAGE events. PAGE-only: asset, API and system paths are never recorded.
CREATE TABLE visitor_events (
  id                    TEXT PRIMARY KEY,
  occurred_at           INTEGER NOT NULL,
  date_local            TEXT NOT NULL,
  ip_address            TEXT NOT NULL CHECK (length(ip_address) BETWEEN 2 AND 45),
  country               TEXT,
  region                TEXT,
  city                  TEXT,
  colo                  TEXT,
  path                  TEXT NOT NULL
                        CHECK (length(path) <= 512 AND instr(path, '?') = 0 AND instr(path, '#') = 0),
  referrer_origin       TEXT NOT NULL CHECK (length(referrer_origin) <= 255),
  user_agent            TEXT NOT NULL CHECK (length(user_agent) <= 512),
  browser_family        TEXT NOT NULL,
  device_class          TEXT NOT NULL
                        CHECK (device_class IN ('desktop','mobile','tablet','other','unknown')),
  actor_class           TEXT NOT NULL
                        CHECK (actor_class IN ('verified-bot','automated-likely','human-likely','unknown')),
  classification_source TEXT NOT NULL
                        CHECK (classification_source IN ('cf-bot-management','user-agent-rule','none')),
  session_id            TEXT NOT NULL,
  request_id            TEXT
);

-- Indexes are chosen for the query paths the Boss analytics module actually
-- emits, not speculatively.
--   occurred_at        : stream ordering, range scans, oldest-event age
--   date_local         : per-local-day raw fallback and TODAY ordinals
--   path/country/actor : the selective filters, each paired with time
--   ip_address         : operator IP filter and repeat inspection
CREATE INDEX visitor_events_occurred_idx      ON visitor_events (occurred_at DESC, id DESC);
CREATE INDEX visitor_events_local_day_idx     ON visitor_events (date_local, occurred_at DESC);
CREATE INDEX visitor_events_path_time_idx     ON visitor_events (path, occurred_at DESC);
CREATE INDEX visitor_events_country_time_idx  ON visitor_events (country, occurred_at DESC);
CREATE INDEX visitor_events_actor_time_idx    ON visitor_events (actor_class, occurred_at DESC);
CREATE INDEX visitor_events_ip_time_idx       ON visitor_events (ip_address, occurred_at DESC);

-- Daily aggregates, keyed by America/Los_Angeles local day.
CREATE TABLE analytics_daily (
  date_local        TEXT NOT NULL,
  aggregate_version INTEGER NOT NULL,
  path              TEXT NOT NULL,
  country           TEXT NOT NULL,
  device_class      TEXT NOT NULL,
  browser_family    TEXT NOT NULL,
  actor_class       TEXT NOT NULL,
  event_count       INTEGER NOT NULL CHECK (event_count >= 0),
  PRIMARY KEY (date_local, aggregate_version, path, country, device_class,
               browser_family, actor_class)
);
CREATE INDEX analytics_daily_version_day_idx ON analytics_daily (aggregate_version, date_local);

-- The coverage ledger. A row here is the only evidence that a local day was
-- fully and trustworthily aggregated at a given semantics version. A covered
-- day with event_count 0 is a real, readable zero; a day absent from this table
-- is uncovered and must be answered from raw events.
CREATE TABLE analytics_coverage (
  date_local        TEXT NOT NULL,
  aggregate_version INTEGER NOT NULL,
  event_count       INTEGER NOT NULL CHECK (event_count >= 0),
  covered_at        INTEGER NOT NULL,
  source_max_occurred_at INTEGER,
  PRIMARY KEY (date_local, aggregate_version)
);
CREATE INDEX analytics_coverage_version_day_idx ON analytics_coverage (aggregate_version, date_local);

-- Record of explicit operator deletions. Deletion is manual, previewed,
-- confirmed and audited; this table is the analytics-side record and the
-- matching audit row is written to APP_DB.
CREATE TABLE analytics_deletion_log (
  id            TEXT PRIMARY KEY,
  ran_at        INTEGER NOT NULL,
  cutoff_at     INTEGER NOT NULL,
  rows_deleted  INTEGER NOT NULL CHECK (rows_deleted >= 0),
  actor         TEXT NOT NULL,
  request_id    TEXT
);
CREATE INDEX analytics_deletion_ran_idx ON analytics_deletion_log (ran_at DESC);
