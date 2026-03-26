-- Migration: Hot Topics Telemetry & Content Quality Scoring
-- Adds columns for algorithmic ranking without relying solely on votes

-- Add telemetry columns to issues_852
ALTER TABLE issues_852 ADD COLUMN IF NOT EXISTS content_metrics JSONB DEFAULT NULL;
ALTER TABLE issues_852 ADD COLUMN IF NOT EXISTS quality_score INT DEFAULT 0;
ALTER TABLE issues_852 ADD COLUMN IF NOT EXISTS engagement_potential INT DEFAULT 0;

-- Content metrics structure:
-- {
--   word_count: number,
--   sentence_count: number,
--   paragraph_count: number,
--   has_examples: boolean,
--   has_proposed_solution: boolean,
--   has_data_or_evidence: boolean,
--   subject_count: number,
--   complexity_tier: 'simple' | 'moderate' | 'complex',
--   category_relevance: number (1-10)
-- }

-- Create index for efficient sorting by quality
CREATE INDEX IF NOT EXISTS idx_issues_852_quality ON issues_852 (quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_issues_852_engagement ON issues_852 (engagement_potential DESC);

-- Create function to calculate content metrics automatically
CREATE OR REPLACE FUNCTION calculate_issue_metrics(content_text TEXT, title_text TEXT, category TEXT)
RETURNS JSONB AS $$
DECLARE
  word_count INT;
  sentence_count INT;
  paragraph_count INT;
  has_examples BOOLEAN;
  has_proposed_solution BOOLEAN;
  has_data_or_evidence BOOLEAN;
  complexity_tier TEXT;
  result JSONB;
BEGIN
  -- Count words (approximate)
  word_count := array_length(regexp_split_to_array(COALESCE(content_text, '') || ' ' || COALESCE(title_text, ''), '\s+'), 1);
  IF word_count IS NULL THEN word_count := 0; END IF;
  
  -- Count sentences (approximate by punctuation)
  sentence_count := array_length(regexp_split_to_array(COALESCE(content_text, ''), '[.!?]+'), 1);
  IF sentence_count IS NULL THEN sentence_count := 0; END IF;
  
  -- Count paragraphs (by newlines)
  paragraph_count := array_length(regexp_split_to_array(COALESCE(content_text, ''), '\n+'), 1);
  IF paragraph_count IS NULL OR paragraph_count = 0 THEN paragraph_count := 1; END IF;
  
  -- Check for examples (keywords like "exemplo", "por exemplo", "caso")
  has_examples := content_text ~* '(exemplo|exemplos|por exemplo|como por exemplo|caso de|situação)';
  
  -- Check for proposed solutions (keywords)
  has_proposed_solution := content_text ~* '(sugiro|sugestão|proponho|proposta|recomendo|recomendação|deveria|precisamos|solução)';
  
  -- Check for data/evidence (keywords like numbers, percentages, statistics)
  has_data_or_evidence := content_text ~* '(\d+%|\d+ por cento|dado|estatística|pesquisa|estudo|relatório|número|total|quantidade)';
  
  -- Determine complexity tier
  IF word_count < 50 THEN
    complexity_tier := 'simple';
  ELSIF word_count < 200 THEN
    complexity_tier := 'moderate';
  ELSE
    complexity_tier := 'complex';
  END IF;
  
  result := jsonb_build_object(
    'word_count', word_count,
    'sentence_count', sentence_count,
    'paragraph_count', paragraph_count,
    'has_examples', has_examples,
    'has_proposed_solution', has_proposed_solution,
    'has_data_or_evidence', has_data_or_evidence,
    'subject_count', LEAST(paragraph_count, 5), -- approximate subjects by paragraphs
    'complexity_tier', complexity_tier,
    'category_relevance', 5 -- default, can be enhanced by AI later
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate quality score from metrics
CREATE OR REPLACE FUNCTION calculate_quality_score(metrics JSONB)
RETURNS INT AS $$
DECLARE
  score INT := 0;
  word_count INT;
  complexity_tier TEXT;
BEGIN
  IF metrics IS NULL THEN RETURN 0; END IF;
  
  word_count := COALESCE((metrics->>'word_count')::INT, 0);
  complexity_tier := COALESCE(metrics->>'complexity_tier', 'simple');
  
  -- Base score from content length (max 30 points)
  score := score + LEAST(word_count / 10, 30);
  
  -- Completeness bonuses
  IF (metrics->>'has_examples')::BOOLEAN THEN score := score + 15; END IF;
  IF (metrics->>'has_proposed_solution')::BOOLEAN THEN score := score + 20; END IF;
  IF (metrics->>'has_data_or_evidence')::BOOLEAN THEN score := score + 15; END IF;
  
  -- Complexity bonus
  IF complexity_tier = 'complex' THEN score := score + 20;
  ELSIF complexity_tier = 'moderate' THEN score := score + 10;
  END IF;
  
  -- Subject diversity bonus (max 20 points)
  score := score + LEAST(COALESCE((metrics->>'subject_count')::INT, 1) * 4, 20);
  
  RETURN LEAST(score, 100); -- Cap at 100
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate metrics on insert/update
CREATE OR REPLACE FUNCTION update_issue_metrics()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content_metrics := calculate_issue_metrics(NEW.body, NEW.title, NEW.category);
  NEW.quality_score := calculate_quality_score(NEW.content_metrics);
  
  -- Calculate engagement potential (quality + recency factor)
  NEW.engagement_potential := NEW.quality_score + 
    GREATEST(0, 50 - EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 3600)::INT;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_calculate_metrics ON issues_852;

-- Create trigger
CREATE TRIGGER auto_calculate_metrics
  BEFORE INSERT OR UPDATE ON issues_852
  FOR EACH ROW
  EXECUTE FUNCTION update_issue_metrics();

-- Backfill existing issues
UPDATE issues_852 
SET content_metrics = calculate_issue_metrics(body, title, category),
    quality_score = calculate_quality_score(calculate_issue_metrics(body, title, category)),
    engagement_potential = calculate_quality_score(calculate_issue_metrics(body, title, category)) + 
      GREATEST(0, 50 - EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600)::INT
WHERE content_metrics IS NULL;
