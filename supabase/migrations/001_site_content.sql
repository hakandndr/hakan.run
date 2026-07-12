-- Run this once in the Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run

CREATE TABLE IF NOT EXISTS site_content (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section    text        UNIQUE NOT NULL,
  data       jsonb       NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Auto-update updated_at on every write
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Public can read all rows
CREATE POLICY "Public read"
  ON site_content FOR SELECT
  USING (true);

-- Only authenticated users (admin) can write
CREATE POLICY "Authenticated write"
  ON site_content FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
