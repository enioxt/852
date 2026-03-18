-- ╔══════════════════════════════════════════════════════════════╗
-- ║  852 Inteligência — Migration v8                             ║
-- ║  Adds: auth_provider, password_set_at, google_sub,          ║
-- ║        avatar_url, profile_completed_at                     ║
-- ║  Fixes: password_hash nullable (Google-only accounts)       ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ── 1. Make password_hash nullable (Google accounts have no password) ──

ALTER TABLE user_accounts_852
  ALTER COLUMN password_hash DROP NOT NULL;

-- ── 2. Add auth columns for Google Identity + password reset ──────────

ALTER TABLE user_accounts_852
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'password'
    CHECK (auth_provider IN ('password', 'google', 'hybrid')),
  ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_sub TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- ── 3. Index on google_sub for fast lookup during Google login ────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_accounts_852_google_sub
  ON user_accounts_852(google_sub) WHERE google_sub IS NOT NULL;

-- ── 4. Backfill existing rows ─────────────────────────────────────────

UPDATE user_accounts_852
  SET auth_provider = 'password'
  WHERE auth_provider IS NULL AND password_hash IS NOT NULL;

-- ── 5. Update pending_validations view to include new columns ─────────
-- Drop and recreate because column names changed (nome_partial → display_name)

DROP VIEW IF EXISTS pending_validations_852;

CREATE OR REPLACE VIEW pending_validations_852 AS
  SELECT
    id, email, display_name, nome_partial, masp, lotacao,
    validation_status, auth_provider, avatar_url, created_at
  FROM user_accounts_852
  WHERE validation_status = 'pending'
  ORDER BY created_at DESC;

COMMENT ON COLUMN user_accounts_852.auth_provider IS 'password=email/senha; google=somente Google; hybrid=ambos';
COMMENT ON COLUMN user_accounts_852.google_sub IS 'Google account sub (unique identifier from ID token)';
COMMENT ON COLUMN user_accounts_852.profile_completed_at IS 'Timestamp when user first completed onboarding profile';
