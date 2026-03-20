-- Migration v10: Remote Suggestion Drafts
CREATE TABLE IF NOT EXISTS suggestion_drafts_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_accounts_852(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  raw_body TEXT NOT NULL,
  sanitized_body TEXT NOT NULL,
  category TEXT NOT NULL,
  
  tags JSONB DEFAULT '[]'::jsonb NOT NULL,
  attachment_names JSONB DEFAULT '[]'::jsonb NOT NULL,
  
  pii_removed INTEGER DEFAULT 0 NOT NULL,
  atrian_score INTEGER DEFAULT 0 NOT NULL,
  atrian_passed BOOLEAN DEFAULT false NOT NULL,
  atrian_violation_count INTEGER DEFAULT 0 NOT NULL,
  
  review_data JSONB,
  issue_id TEXT,
  
  status TEXT NOT NULL DEFAULT 'draft',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE suggestion_drafts_852 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_suggestion_drafts" ON suggestion_drafts_852 FOR ALL USING (auth.role() = 'service_role');

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_suggestion_drafts_user_id ON suggestion_drafts_852(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_drafts_status ON suggestion_drafts_852(status);
