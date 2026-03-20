-- Migration v12: Add downvotes to Issues for Espiral de Escuta AI trigger
-- Project: lhscgsqhiooyatkebose

ALTER TABLE public.issue_votes_852 ADD COLUMN IF NOT EXISTS vote_type TEXT DEFAULT 'up' CHECK (vote_type IN ('up', 'down'));
ALTER TABLE public.issues_852 ADD COLUMN IF NOT EXISTS downvotes INT DEFAULT 0;
