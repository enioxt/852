-- Migration: Single Intelligence Report System
-- Converts from multiple periodic reports to one cumulative master report

-- Add fields to ai_reports_852 for cumulative tracking
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS is_master_report BOOLEAN DEFAULT false;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS total_conversations_all_time INTEGER DEFAULT 0;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS total_reports_all_time INTEGER DEFAULT 0;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS last_synced_conversation_id UUID;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS last_synced_report_id UUID;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS cumulative_insights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS historical_patterns JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ai_reports_852 ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create index for master report lookup
CREATE INDEX IF NOT EXISTS idx_ai_reports_master ON ai_reports_852(is_master_report) WHERE is_master_report = true;

-- Mark existing reports as non-master (will be archived)
UPDATE ai_reports_852 SET is_master_report = false WHERE is_master_report IS NULL;

-- Function to get or create master report
CREATE OR REPLACE FUNCTION get_or_create_master_report()
RETURNS UUID AS $$
DECLARE
    master_id UUID;
BEGIN
    -- Try to find existing master report
    SELECT id INTO master_id
    FROM ai_reports_852
    WHERE is_master_report = true
    ORDER BY created_at DESC
    LIMIT 1;

    -- Return existing or NULL (will be created by API)
    RETURN master_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update master report with new data
CREATE OR REPLACE FUNCTION update_master_report(
    p_report_id UUID,
    p_new_conversations INTEGER,
    p_new_reports INTEGER,
    p_new_insights JSONB,
    p_new_patterns JSONB,
    p_last_convo_id UUID,
    p_last_report_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE ai_reports_852 SET
        total_conversations_all_time = total_conversations_all_time + p_new_conversations,
        total_reports_all_time = total_reports_all_time + p_new_reports,
        cumulative_insights = cumulative_insights || p_new_insights,
        historical_patterns = historical_patterns || p_new_patterns,
        last_synced_conversation_id = p_last_convo_id,
        last_synced_report_id = p_last_report_id,
        version = version + 1,
        updated_at = NOW()
    WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN ai_reports_852.is_master_report IS 'True if this is the single cumulative master report';
COMMENT ON COLUMN ai_reports_852.total_conversations_all_time IS 'Running total of all conversations analyzed since system start';
COMMENT ON COLUMN ai_reports_852.total_reports_all_time IS 'Running total of all user reports analyzed since system start';
COMMENT ON COLUMN ai_reports_852.cumulative_insights IS 'All insights ever generated, deduplicated';
COMMENT ON COLUMN ai_reports_852.historical_patterns IS 'All patterns ever detected across all time periods';
