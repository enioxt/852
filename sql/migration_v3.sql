-- Migration v3: Issues, AI Reports, User Auth
-- Run against Supabase project lhscgsqhiooyatkebose

-- ══════════════════════════════════════════════
-- 1. Issues (GitHub-like anonymous discussion)
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS issues_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_discussion', 'resolved', 'closed')),
  category TEXT,
  source TEXT DEFAULT 'user' CHECK (source IN ('user', 'ai_suggestion')),
  ai_report_id UUID,
  votes INT DEFAULT 0,
  comment_count INT DEFAULT 0
);

ALTER TABLE issues_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issues_852_anon_read" ON issues_852 FOR SELECT USING (true);
CREATE POLICY "issues_852_anon_insert" ON issues_852 FOR INSERT WITH CHECK (true);
CREATE POLICY "issues_852_anon_update" ON issues_852 FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_issues_852_status ON issues_852 (status);
CREATE INDEX IF NOT EXISTS idx_issues_852_votes ON issues_852 (votes DESC);
CREATE INDEX IF NOT EXISTS idx_issues_852_created ON issues_852 (created_at DESC);

-- ══════════════════════════════════════════════
-- 2. Issue Votes (prevent double voting)
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS issue_votes_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  issue_id UUID REFERENCES issues_852(id) ON DELETE CASCADE,
  session_hash TEXT NOT NULL,
  UNIQUE(issue_id, session_hash)
);

ALTER TABLE issue_votes_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issue_votes_852_anon_all" ON issue_votes_852 FOR ALL USING (true);

-- ══════════════════════════════════════════════
-- 3. Issue Comments
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS issue_comments_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  issue_id UUID REFERENCES issues_852(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT false
);

ALTER TABLE issue_comments_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issue_comments_852_anon_read" ON issue_comments_852 FOR SELECT USING (true);
CREATE POLICY "issue_comments_852_anon_insert" ON issue_comments_852 FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_issue_comments_852_issue ON issue_comments_852 (issue_id, created_at);

-- ══════════════════════════════════════════════
-- 4. AI Reports
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_reports_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  trigger_type TEXT DEFAULT 'auto_5' CHECK (trigger_type IN ('auto_5', 'manual')),
  model_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  tokens_in INT DEFAULT 0,
  tokens_out INT DEFAULT 0,
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  duration_ms INT DEFAULT 0,
  conversation_count INT DEFAULT 0,
  report_count INT DEFAULT 0,
  content_html TEXT,
  content_summary TEXT,
  insights JSONB,
  pending_topics JSONB,
  metadata JSONB
);

ALTER TABLE ai_reports_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_reports_852_anon_read" ON ai_reports_852 FOR SELECT USING (true);
CREATE POLICY "ai_reports_852_anon_insert" ON ai_reports_852 FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ai_reports_852_created ON ai_reports_852 (created_at DESC);

-- ══════════════════════════════════════════════
-- 5. User Accounts (optional login)
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_accounts_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ
);

ALTER TABLE user_accounts_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_accounts_852_anon_insert" ON user_accounts_852 FOR INSERT WITH CHECK (true);
CREATE POLICY "user_accounts_852_anon_select" ON user_accounts_852 FOR SELECT USING (true);
CREATE POLICY "user_accounts_852_anon_update" ON user_accounts_852 FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_user_accounts_852_email ON user_accounts_852 (email);

-- ══════════════════════════════════════════════
-- 6. User Sessions
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_sessions_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES user_accounts_852(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE user_sessions_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_sessions_852_anon_all" ON user_sessions_852 FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_user_sessions_852_token ON user_sessions_852 (token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_852_user ON user_sessions_852 (user_id);
