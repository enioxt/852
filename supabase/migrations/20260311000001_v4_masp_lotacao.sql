-- ╔══════════════════════════════════════════════════════════════╗
-- ║  852 Inteligência — Migration v4                             ║
-- ║  Adds: MASP + lotação fields, validation status,            ║
-- ║        user-based vote dedup for authenticated users        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ── 1. Extend user_accounts_852 with MASP + lotação ──────────

ALTER TABLE user_accounts_852
  ADD COLUMN IF NOT EXISTS masp VARCHAR(20),
  ADD COLUMN IF NOT EXISTS lotacao VARCHAR(150),
  ADD COLUMN IF NOT EXISTS nome_partial VARCHAR(100),
  ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'none'
    CHECK (validation_status IN ('none', 'pending', 'approved', 'rejected'));

-- Unique MASP constraint (one account per officer)
CREATE UNIQUE INDEX IF NOT EXISTS user_accounts_masp_unique
  ON user_accounts_852(masp) WHERE masp IS NOT NULL;

-- ── 2. Extend issue_votes_852 with user_id link ───────────────

ALTER TABLE issue_votes_852
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_accounts_852(id) ON DELETE CASCADE;

-- One vote per (issue, user) for authenticated users
CREATE UNIQUE INDEX IF NOT EXISTS issue_votes_user_unique
  ON issue_votes_852(issue_id, user_id) WHERE user_id IS NOT NULL;

-- ── 3. Extend issues_852 with extra categories ────────────────

-- Add new categories for police-specific issues
ALTER TABLE issues_852
  DROP CONSTRAINT IF EXISTS issues_852_category_check;

-- No check constraint on category — allow any string value

-- ── 4. Account deletion cascade — reports + votes ────────────

-- Ensure votes cascade on user delete (already handled by user_id FK above)
-- Reports: session_hash is stored as text, not a FK — manual deletion via API

-- ── 5. Admin validation helper view ─────────────────────────

CREATE OR REPLACE VIEW pending_validations_852 AS
  SELECT
    id, email, nome_partial, masp, lotacao,
    validation_status, created_at
  FROM user_accounts_852
  WHERE validation_status = 'pending'
  ORDER BY created_at DESC;

-- ── 6. Comments: allow attaching a user_id ───────────────────

ALTER TABLE issue_comments_852
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_accounts_852(id) ON DELETE SET NULL;

-- ── 7. RLS policies update ────────────────────────────────────

-- Allow selecting pending validations only for service role (already handled by SUPABASE_SERVICE_ROLE_KEY)
-- No new RLS needed; existing policies on issues/comments/votes remain

COMMENT ON COLUMN user_accounts_852.masp IS 'MASP do policial civil — verificado manualmente pelo administrador';
COMMENT ON COLUMN user_accounts_852.lotacao IS 'Lotação atual declarada pelo policial';
COMMENT ON COLUMN user_accounts_852.validation_status IS 'none=sem MASP; pending=aguarda verificação; approved=verificado; rejected=rejeitado';
