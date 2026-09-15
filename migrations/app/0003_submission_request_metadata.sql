-- Private request metadata belongs to the durable submission record in APP_DB.
-- Existing rows remain NULL; submission metadata is never analytics data.
ALTER TABLE submissions ADD COLUMN source_ip TEXT;
ALTER TABLE submissions ADD COLUMN cf_region TEXT;
ALTER TABLE submissions ADD COLUMN cf_region_code TEXT;
ALTER TABLE submissions ADD COLUMN cf_city TEXT;
ALTER TABLE submissions ADD COLUMN cf_continent TEXT;
ALTER TABLE submissions ADD COLUMN cf_colo TEXT;
ALTER TABLE submissions ADD COLUMN cf_asn INTEGER;
ALTER TABLE submissions ADD COLUMN cf_as_organization TEXT;
ALTER TABLE submissions ADD COLUMN http_protocol TEXT;
ALTER TABLE submissions ADD COLUMN tls_version TEXT;
