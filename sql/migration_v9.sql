CREATE TABLE IF NOT EXISTS auth_codes_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address TEXT
);
CREATE INDEX IF NOT EXISTS idx_auth_codes_852_email ON auth_codes_852(email, created_at DESC);
ALTER TABLE auth_codes_852 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_auth_codes" ON auth_codes_852;
CREATE POLICY "service_role_auth_codes" ON auth_codes_852 FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE issues_852 ADD COLUMN IF NOT EXISTS ai_report_id UUID;
ALTER TABLE issues_852 DROP CONSTRAINT IF EXISTS issues_852_source_check;
ALTER TABLE issues_852 ADD CONSTRAINT issues_852_source_check CHECK (source IN ('user', 'ai_suggestion', 'ai_report', 'ai_auto'));
