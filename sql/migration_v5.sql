ALTER TABLE user_accounts_852
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verification_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_accounts_852_email_verification_token_hash
  ON user_accounts_852(email_verification_token_hash)
  WHERE email_verification_token_hash IS NOT NULL;
