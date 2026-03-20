-- Migration v13: Issue Versioning (The EGOS Principle)

ALTER TABLE issues_852 ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES issues_852(id) ON DELETE SET NULL;
ALTER TABLE issues_852 ADD COLUMN IF NOT EXISTS version_author_id UUID REFERENCES user_accounts_852(id) ON DELETE SET NULL;
ALTER TABLE issues_852 ADD COLUMN IF NOT EXISTS version_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_issues_852_parent ON issues_852 (parent_id);
