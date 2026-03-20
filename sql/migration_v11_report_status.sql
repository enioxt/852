-- Migration v11: Expand report status to include moderation states
-- Project: lhscgsqhiooyatkebose

-- Drop the existing constraint
ALTER TABLE public.reports_852 DROP CONSTRAINT IF EXISTS reports_852_status_check;

-- Add the new constraint with expanded statuses
ALTER TABLE public.reports_852 ADD CONSTRAINT reports_852_status_check 
  CHECK (status IN ('draft', 'reviewed', 'shared', 'deleted', 'ai_reviewed', 'pending_human', 'published'));

-- (Optional) If we also want to expand the issues_852 statuses? 
-- The plan says "Restrict /issues rendering to only show fully published/approved reports."
-- This means issues might not need new statuses, but the issues page will only show issues 
-- derived from published reports. 
-- Wait, if an issue is created directly on the board, it has status 'open'.
-- If a report requires approval before becoming an issue, we just delay the issue creation!
-- Yes! We don't create the issue in `api/reports/server` until the report is approved.
