-- ╔══════════════════════════════════════════════════════════════╗
-- ║  852 Inteligência — Migration v6: Gamification              ║
-- ║  Adds: reputation points, atomic increment function         ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ── 1. Add reputation_points column ─────────────────────────

ALTER TABLE user_accounts_852
  ADD COLUMN IF NOT EXISTS reputation_points INTEGER DEFAULT 0;

-- ── 2. Atomic increment function ────────────────────────────

CREATE OR REPLACE FUNCTION increment_reputation_852(
  target_user_id UUID,
  points_to_add INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  new_total INTEGER;
BEGIN
  UPDATE user_accounts_852
  SET reputation_points = COALESCE(reputation_points, 0) + points_to_add
  WHERE id = target_user_id
  RETURNING reputation_points INTO new_total;

  RETURN COALESCE(new_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. Leaderboard index ────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_accounts_852_reputation
  ON user_accounts_852(reputation_points DESC)
  WHERE reputation_points > 0;
