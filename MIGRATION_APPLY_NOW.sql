-- ============================================================
-- MIGRATION: Single Intelligence Report System (852)
-- File: 20260409160000_single_intelligence_report.sql
-- Apply via: https://supabase.com/dashboard/project/lhscgsqhiooyatkebose/sql-editor
-- ============================================================

-- 1. Add new columns for master report tracking
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS is_master_report BOOLEAN DEFAULT false;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS total_conversations_all_time INTEGER DEFAULT 0;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS total_reports_all_time INTEGER DEFAULT 0;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS last_synced_conversation_id UUID;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS last_synced_report_id UUID;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS cumulative_insights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS historical_patterns JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 2. Create index for fast master report lookup
CREATE INDEX IF NOT EXISTS idx_ai_reports_master ON ai_reports_852(is_master_report) WHERE is_master_report = true;

-- 3. Initialize existing reports as non-master
UPDATE ai_reports_852 SET is_master_report = false WHERE is_master_report IS NULL;

-- ============================================================
-- VERIFICATION QUERIES (run after migration):
-- ============================================================

-- Check if columns were added:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ai_reports_852' ORDER BY ordinal_position;

-- Check index created:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'ai_reports_852';

-- Count reports:
-- SELECT COUNT(*) as total_reports FROM ai_reports_852;

-- ============================================================
