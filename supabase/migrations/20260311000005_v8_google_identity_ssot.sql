ALTER TABLE user_accounts_852
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE user_accounts_852
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'password'
    CHECK (auth_provider IN ('password', 'google', 'hybrid')),
  ADD COLUMN IF NOT EXISTS google_sub TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS user_accounts_852_google_sub_unique
  ON user_accounts_852 (google_sub)
  WHERE google_sub IS NOT NULL;

UPDATE user_accounts_852
SET auth_provider = 'password'
WHERE auth_provider IS NULL;

UPDATE user_accounts_852
SET profile_completed_at = COALESCE(profile_completed_at, created_at)
WHERE COALESCE(display_name, '') <> '';

UPDATE user_accounts_852
SET password_set_at = COALESCE(password_set_at, created_at)
WHERE password_hash IS NOT NULL;
