-- 852 Inteligência — Telemetry Table
-- Run in Supabase SQL editor when ready to activate persistence

CREATE TABLE IF NOT EXISTS telemetry_852 (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type    TEXT NOT NULL,
  model_id      TEXT,
  provider      TEXT,
  tokens_in     INTEGER,
  tokens_out    INTEGER,
  cost_usd      NUMERIC(10, 6),
  duration_ms   INTEGER,
  client_ip_hash TEXT,
  status_code   INTEGER,
  error_message TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_telemetry_852_created ON telemetry_852 (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_852_type ON telemetry_852 (event_type);

-- RLS (required by EGOS governance)
ALTER TABLE telemetry_852 ENABLE ROW LEVEL SECURITY;

-- Policy: service role can insert (server-side only)
CREATE POLICY "service_insert" ON telemetry_852
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Policy: service role can read (admin dashboard)
CREATE POLICY "service_select" ON telemetry_852
  FOR SELECT TO service_role
  USING (true);

-- Comment
COMMENT ON TABLE telemetry_852 IS '852 Inteligência telemetry events — chat completions, errors, rate limits';
