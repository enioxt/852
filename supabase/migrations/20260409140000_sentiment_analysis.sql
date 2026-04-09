-- Migration: Sentiment Analysis for 852
-- Tracks mood/sentiment trends from reports, issues, and comments

-- Sentiment analysis table
CREATE TABLE IF NOT EXISTS sentiment_analysis_852 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL CHECK (source_type IN ('report', 'issue', 'comment')),
    source_id UUID NOT NULL,
    sentiment_label TEXT NOT NULL CHECK (sentiment_label IN ('positive', 'negative', 'neutral', 'mixed')),
    sentiment_confidence DECIMAL(4,3) NOT NULL CHECK (sentiment_confidence >= 0 AND sentiment_confidence <= 1),
    positive_score DECIMAL(4,3) NOT NULL CHECK (positive_score >= 0 AND positive_score <= 1),
    negative_score DECIMAL(4,3) NOT NULL CHECK (negative_score >= 0 AND negative_score <= 1),
    neutral_score DECIMAL(4,3) NOT NULL CHECK (neutral_score >= 0 AND neutral_score <= 1),
    key_phrases TEXT[] DEFAULT '{}',
    urgency_indicators TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_sentiment_source ON sentiment_analysis_852(source_type, source_id);
CREATE INDEX idx_sentiment_label ON sentiment_analysis_852(sentiment_label);
CREATE INDEX idx_sentiment_created ON sentiment_analysis_852(created_at);
CREATE INDEX idx_sentiment_source_created ON sentiment_analysis_852(source_type, created_at);

-- Enable RLS
ALTER TABLE sentiment_analysis_852 ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert/update
CREATE POLICY sentiment_insert_service ON sentiment_analysis_852
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY sentiment_update_service ON sentiment_analysis_852
    FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Policy: Admins can view all
CREATE POLICY sentiment_select_admin ON sentiment_analysis_852
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM admin_sessions_852
            WHERE user_id = auth.uid()
            AND expires_at > NOW()
        )
    );

-- Policy: Public can only view aggregated stats (no individual records)
CREATE POLICY sentiment_select_public ON sentiment_analysis_852
    FOR SELECT TO anon USING (false);

-- Function to get sentiment trends (for API)
CREATE OR REPLACE FUNCTION get_sentiment_trends(p_days INT DEFAULT 30)
RETURNS TABLE (
    trend_date DATE,
    avg_sentiment DECIMAL,
    positive_count BIGINT,
    negative_count BIGINT,
    neutral_count BIGINT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(s.created_at) as trend_date,
        AVG(s.positive_score - s.negative_score)::DECIMAL(10,4) as avg_sentiment,
        COUNT(*) FILTER (WHERE s.sentiment_label = 'positive') as positive_count,
        COUNT(*) FILTER (WHERE s.sentiment_label = 'negative') as negative_count,
        COUNT(*) FILTER (WHERE s.sentiment_label IN ('neutral', 'mixed')) as neutral_count,
        COUNT(*) as total_count
    FROM sentiment_analysis_852 s
    WHERE s.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(s.created_at)
    ORDER BY trend_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top trending topics
CREATE OR REPLACE FUNCTION get_trending_topics(p_days INT DEFAULT 7, p_limit INT DEFAULT 10)
RETURNS TABLE (
    topic TEXT,
    mentions BIGINT,
    avg_sentiment DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        UNNEST(s.key_phrases) as topic,
        COUNT(*) as mentions,
        AVG(s.positive_score - s.negative_score)::DECIMAL(10,4) as avg_sentiment
    FROM sentiment_analysis_852 s
    WHERE s.created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND array_length(s.key_phrases, 1) > 0
    GROUP BY topic
    ORDER BY mentions DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_sentiment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sentiment_updated_at
    BEFORE UPDATE ON sentiment_analysis_852
    FOR EACH ROW
    EXECUTE FUNCTION update_sentiment_updated_at();

-- Add comment for documentation
COMMENT ON TABLE sentiment_analysis_852 IS 'Sentiment analysis results for reports, issues, and comments. Tracks mood trends over time.';
