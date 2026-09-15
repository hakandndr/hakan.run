-- Provider delivery metadata belongs to the durable submission record in APP_DB.
-- It is operational state, never analytics data.
ALTER TABLE submissions ADD COLUMN notification_provider TEXT;
ALTER TABLE submissions ADD COLUMN notification_attempted_at INTEGER;
ALTER TABLE submissions ADD COLUMN notification_provider_status INTEGER;
ALTER TABLE submissions ADD COLUMN notification_request_id TEXT;
