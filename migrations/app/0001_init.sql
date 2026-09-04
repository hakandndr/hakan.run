-- APP_DB — application authority for Hakan.run.
-- Content, revisions, submissions, audit and system settings. Analytics lives
-- in ANALYTICS_DB and is never joined across the database boundary.

-- Published content authority. One row per section; `data` is the section
-- payload the public site consumes.
CREATE TABLE content_sections (
  section        TEXT PRIMARY KEY,
  draft_data     TEXT,
  published_data TEXT,
  draft_updated_at     INTEGER,
  published_at         INTEGER,
  published_revision   INTEGER,
  updated_at     INTEGER NOT NULL
);

-- Immutable revision history. A revision is written on every publish, so a
-- published state can always be reconstructed and rolled back to.
CREATE TABLE content_revisions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  section      TEXT NOT NULL,
  revision     INTEGER NOT NULL,
  data         TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  actor        TEXT NOT NULL,
  note         TEXT,
  UNIQUE (section, revision)
);
CREATE INDEX content_revisions_section_created_idx
  ON content_revisions (section, created_at DESC);

-- Public submissions. The row is durable before any notification is attempted;
-- notification outcome is recorded against the row and never gates acceptance.
CREATE TABLE submissions (
  id                    TEXT PRIMARY KEY,
  received_at           INTEGER NOT NULL,
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL,
  message               TEXT NOT NULL,
  source_path           TEXT NOT NULL,
  country               TEXT,
  user_agent            TEXT,
  status                TEXT NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new','reviewing','accepted','rejected','archived')),
  notification_state    TEXT NOT NULL DEFAULT 'stored'
                        CHECK (notification_state IN ('stored','pending','sent','failed','disabled')),
  notification_attempts INTEGER NOT NULL DEFAULT 0 CHECK (notification_attempts >= 0),
  notification_error    TEXT,
  notified_at           INTEGER,
  request_id            TEXT
);
CREATE INDEX submissions_received_idx ON submissions (received_at DESC, id DESC);
CREATE INDEX submissions_status_received_idx ON submissions (status, received_at DESC);

-- Durable audit trail for privileged reads, mutations and destructive actions.
-- Written by the Worker only; never by a client.
CREATE TABLE audit_events (
  id          TEXT PRIMARY KEY,
  occurred_at INTEGER NOT NULL,
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id   TEXT,
  detail      TEXT,
  request_id  TEXT
);
CREATE INDEX audit_events_occurred_idx ON audit_events (occurred_at DESC, id DESC);
CREATE INDEX audit_events_action_occurred_idx ON audit_events (action, occurred_at DESC);

-- System settings. Small, explicit key/value operational configuration that is
-- not a secret and not part of the visual identity.
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT
);

-- Social / OG card text. Layout, typography, colour, logo placement and the
-- <h/> identity are system-controlled in source and are deliberately absent.
CREATE TABLE og_card (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  name            TEXT NOT NULL,
  role_title      TEXT NOT NULL,
  tagline         TEXT NOT NULL,
  location        TEXT NOT NULL,
  footer_slogan   TEXT NOT NULL,
  draft_name          TEXT,
  draft_role_title    TEXT,
  draft_tagline       TEXT,
  draft_location      TEXT,
  draft_footer_slogan TEXT,
  published_at    INTEGER,
  updated_at      INTEGER NOT NULL
);
