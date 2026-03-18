-- ╔══════════════════════════════════════════════════════════════╗
-- ║  852 Inteligência — Migration v9                             ║
-- ║  Adds: auth_codes_852 (OTP email login)                     ║
-- ║        auth_invites_852 (admin allowlist / invites)          ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ── 1. OTP codes table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auth_codes_852 (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  ip_address  TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_codes_852_email
  ON auth_codes_852(email, created_at DESC);

-- Auto-cleanup expired codes older than 1 hour
-- (run manually or via pg_cron if available)

-- ── 2. Admin invite / allowlist table ───────────────────────────

CREATE TABLE IF NOT EXISTS auth_invites_852 (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  invited_by  TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at     TIMESTAMPTZ,
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_auth_invites_852_email
  ON auth_invites_852(email);

-- ── 3. RLS policies ────────────────────────────────────────────

ALTER TABLE auth_codes_852 ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_invites_852 ENABLE ROW LEVEL SECURITY;

-- Service role only — no anon access
CREATE POLICY "service_role_auth_codes" ON auth_codes_852
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_auth_invites" ON auth_invites_852
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE auth_codes_852 IS 'OTP codes for passwordless email login (10-min expiry)';
COMMENT ON TABLE auth_invites_852 IS 'Admin-managed email allowlist for invite-only registration';
