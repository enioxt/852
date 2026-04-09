-- Migration: Performance Indexes for 852
-- Analyzes and creates indexes for slow queries

-- Indexes for issues_852 (high traffic table)
CREATE INDEX IF NOT EXISTS idx_issues_created_at_desc 
  ON issues_852(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_issues_status_category 
  ON issues_852(status, category) 
  WHERE status IN ('open', 'in_discussion');

CREATE INDEX IF NOT EXISTS idx_issues_votes 
  ON issues_852(votes DESC NULLS LAST) 
  WHERE status IN ('open', 'in_discussion');

-- Indexes for conversations_852
CREATE INDEX IF NOT EXISTS idx_conversations_created_at 
  ON conversations_852(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user_created 
  ON conversations_852(user_id, created_at DESC);

-- Indexes for reports_852
CREATE INDEX IF NOT EXISTS idx_reports_created_at 
  ON reports_852(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_user_created 
  ON reports_852(user_id, created_at DESC);

-- Indexes for telemetry_852 (time-series data)
CREATE INDEX IF NOT EXISTS idx_telemetry_event_created 
  ON telemetry_852(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_session 
  ON telemetry_852(session_id, created_at DESC);

-- Indexes for sentiment_analysis_852
CREATE INDEX IF NOT EXISTS idx_sentiment_created_at 
  ON sentiment_analysis_852(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_label 
  ON sentiment_analysis_852(sentiment_label, created_at DESC);

-- Partial index for active issues (optimization for hot topics query)
CREATE INDEX IF NOT EXISTS idx_issues_active 
  ON issues_852(created_at DESC, votes DESC, comment_count DESC) 
  WHERE status IN ('open', 'in_discussion');

-- Index for notification queue (pending notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_pending 
  ON notification_queue_852(created_at ASC) 
  WHERE processed = false;

-- Index for daily digest lookup
CREATE INDEX IF NOT EXISTS idx_daily_digest_user 
  ON daily_digest_queue_852(user_id, scheduled_for ASC) 
  WHERE sent = false;

-- GIN index for key_phrases array (sentiment analysis)
CREATE INDEX IF NOT EXISTS idx_sentiment_key_phrases 
  ON sentiment_analysis_852 USING GIN(key_phrases);

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_telemetry_daily_stats 
  ON telemetry_852(created_at DESC, event_type) 
  WHERE event_type IN ('page_view', 'chat_message_sent', 'report_shared');

-- Index for admin validation queries
CREATE INDEX IF NOT EXISTS idx_user_validations_pending 
  ON user_validations_852(status, created_at DESC) 
  WHERE status = 'pending';

-- Comments
COMMENT ON INDEX idx_issues_created_at_desc IS 'Optimizes hot topics and recent issues queries';
COMMENT ON INDEX idx_issues_status_category IS 'Optimizes category filtering on open issues';
COMMENT ON INDEX idx_telemetry_event_created IS 'Optimizes analytics time-series queries';
COMMENT ON INDEX idx_sentiment_key_phrases IS 'Enables fast topic trending lookups';
