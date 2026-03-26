-- Migration: Knowledge Base System
-- Central repository for articles, books, publications, codes, and research
-- Powers the Super AI Agent across the platform

-- Main knowledge sources table
CREATE TABLE IF NOT EXISTS knowledge_sources_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Source metadata
  title TEXT NOT NULL,
  author TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('article', 'book', 'paper', 'legislation', 'case_study', 'code_repo', 'manual', 'video', 'podcast', 'dataset')),
  
  -- Content details
  description TEXT,
  url TEXT,
  publication_year INT,
  publisher TEXT,
  
  -- Categorization for AI retrieval
  domain_tags TEXT[], -- ['policing', 'technology', 'psychology', 'law', 'management']
  topic_keywords TEXT[], -- ['AI ethics', 'complaint channels', 'anonymous reporting']
  
  -- Quality and verification
  verified_by UUID REFERENCES user_accounts_852(id),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  credibility_score INT DEFAULT 5 CHECK (credibility_score >= 1 AND credibility_score <= 10),
  
  -- Contribution tracking
  contributed_by UUID,
  contribution_notes TEXT,
  
  -- Usage tracking for AI
  citation_count INT DEFAULT 0,
  last_retrieved_at TIMESTAMPTZ,
  ai_relevance_score NUMERIC(5,2) DEFAULT 0.0,
  
  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(array_to_string(topic_keywords, ' '), '')), 'C')
  ) STORED
);

-- Enable RLS
ALTER TABLE knowledge_sources_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "knowledge_sources_read" ON knowledge_sources_852 FOR SELECT USING (true);
CREATE POLICY "knowledge_sources_insert" ON knowledge_sources_852 FOR INSERT WITH CHECK (true);
CREATE POLICY "knowledge_sources_update_own" ON knowledge_sources_852 FOR UPDATE USING (contributed_by = current_setting('request.jwt.claims', true)::json->>'sub');

-- Indexes for efficient retrieval
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_type ON knowledge_sources_852 (source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_domain ON knowledge_sources_852 USING GIN (domain_tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_keywords ON knowledge_sources_852 USING GIN (topic_keywords);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_search ON knowledge_sources_852 USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_verified ON knowledge_sources_852 (verification_status, credibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_ai_score ON knowledge_sources_852 (ai_relevance_score DESC) WHERE ai_relevance_score > 0;

-- Knowledge excerpts/chunks for AI context
CREATE TABLE IF NOT EXISTS knowledge_chunks_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES knowledge_sources_852(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Chunk content
  chunk_text TEXT NOT NULL,
  chunk_index INT NOT NULL, -- order within source
  
  -- Embedding for semantic search (optional, for future vector extension)
  embedding_vector TEXT, -- base64 encoded, or use pgvector later
  
  -- Context
  page_number INT,
  section_title TEXT,
  
  -- Usage
  retrieval_count INT DEFAULT 0,
  
  UNIQUE(source_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON knowledge_chunks_852 (source_id);

-- AI retrieval log for tracking what knowledge is used
CREATE TABLE IF NOT EXISTS knowledge_retrievals_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- What was retrieved
  source_id UUID REFERENCES knowledge_sources_852(id) ON DELETE SET NULL,
  chunk_ids UUID[],
  
  -- Context of retrieval
  conversation_id UUID REFERENCES conversations_852(id) ON DELETE SET NULL,
  report_id UUID REFERENCES reports_852(id) ON DELETE SET NULL,
  query_text TEXT, -- the query that triggered retrieval
  
  -- Retrieval method
  method TEXT CHECK (method IN ('semantic', 'keyword', 'hybrid', 'manual')),
  relevance_score NUMERIC(5,2)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_retrievals_source ON knowledge_retrievals_852 (source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_retrievals_conversation ON knowledge_retrievals_852 (conversation_id);

-- User contributions tracking
CREATE TABLE IF NOT EXISTS knowledge_contributions_852 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  source_id UUID REFERENCES knowledge_sources_852(id) ON DELETE CASCADE,
  contributor_id UUID REFERENCES user_accounts_852(id) ON DELETE SET NULL,
  
  contribution_type TEXT CHECK (contribution_type IN ('submitted', 'verified', 'edited', 'cited')),
  notes TEXT
);

-- Function to increment citation count
CREATE OR REPLACE FUNCTION increment_knowledge_citation(source_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE knowledge_sources_852 
  SET citation_count = citation_count + 1,
      last_retrieved_at = NOW()
  WHERE id = source_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to find relevant knowledge for a query
CREATE OR REPLACE FUNCTION search_knowledge(
  query_text TEXT,
  domain_filter TEXT[] DEFAULT NULL,
  limit_results INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  source_type TEXT,
  url TEXT,
  credibility_score INT,
  rank_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ks.id,
    ks.title,
    ks.description,
    ks.source_type,
    ks.url,
    ks.credibility_score,
    ts_rank(ks.search_vector, websearch_to_tsquery('portuguese', query_text))::REAL AS rank_score
  FROM knowledge_sources_852 ks
  WHERE 
    ks.verification_status = 'verified'
    AND ks.search_vector @@ websearch_to_tsquery('portuguese', query_text)
    AND (domain_filter IS NULL OR ks.domain_tags && domain_filter)
  ORDER BY rank_score DESC, ks.credibility_score DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- Insert sample high-quality sources (seed data)
INSERT INTO knowledge_sources_852 (
  title, author, source_type, description, 
  domain_tags, topic_keywords, 
  verification_status, credibility_score, ai_relevance_score
) VALUES 
(
  'Anonymous Reporting Best Practices: What Actually Works',
  'Lantern Research',
  'paper',
  'Research on effective anonymous complaint channels and protected speak-up systems',
  ARRAY['policing', 'ethics', 'management'],
  ARRAY['anonymous reporting', 'whistleblowing', 'complaint channels', 'trust'],
  'verified', 9, 9.5
),
(
  'How to Encourage Employees to Report Misconduct',
  'VoxWel Ethics Lab',
  'article',
  'Practical guide for organizations to build trust in reporting systems',
  ARRAY['management', 'psychology'],
  ARRAY['reporting culture', 'trust building', 'organizational ethics'],
  'verified', 8, 8.5
),
(
  'Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018',
  'Presidência da República',
  'legislation',
  'Brazilian data protection law relevant for anonymous systems',
  ARRAY['law', 'privacy'],
  ARRAY['LGPD', 'data privacy', 'anonymity', 'compliance'],
  'verified', 10, 7.0
),
(
  'Police Organizational Culture and Whistleblowing',
  'Journal of Criminal Justice',
  'paper',
  'Academic study on factors affecting police officers willingness to report internal issues',
  ARRAY['policing', 'psychology'],
  ARRAY['police culture', 'whistleblowing', 'organizational trust', 'internal reporting'],
  'verified', 9, 9.0
)
ON CONFLICT DO NOTHING;
