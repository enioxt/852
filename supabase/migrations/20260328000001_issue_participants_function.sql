-- Migration: Helper function to get issue participants
-- Date: 2026-03-28
-- Purpose: Retrieve all users who have participated in an issue (voters + commenters)
-- Used by email notification system

CREATE OR REPLACE FUNCTION get_issue_participants(p_issue_id UUID)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT v.user_id
  FROM issue_votes_852 v
  WHERE v.issue_id = p_issue_id
    AND v.user_id IS NOT NULL
  UNION ALL
  SELECT DISTINCT c.user_id
  FROM issue_comments_852 c
  WHERE c.issue_id = p_issue_id
    AND c.user_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION get_issue_participants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_issue_participants(UUID) TO service_role;
