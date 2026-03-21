-- ============================================================================
-- ETHIK Agent — Supabase Migration
-- Tables: payments, donations, scores, periods, actions
-- Author: Enio Rocha | 2026-03-21
-- ============================================================================

-- 1. x402 Payments (API monetization via stablecoin micropayments)
CREATE TABLE IF NOT EXISTS ethik_payments_852 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL DEFAULT 'base',
  token TEXT NOT NULL DEFAULT 'USDC',
  amount_raw TEXT NOT NULL,
  amount_usd DECIMAL(12,6) NOT NULL,
  payer_address TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  request_metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ethik_payments_payer ON ethik_payments_852(payer_address);
CREATE INDEX IF NOT EXISTS idx_ethik_payments_endpoint ON ethik_payments_852(api_endpoint);
CREATE INDEX IF NOT EXISTS idx_ethik_payments_created ON ethik_payments_852(created_at DESC);

-- 2. Direct Donations (PIX, BTC, ETH, SOL, BNB)
CREATE TABLE IF NOT EXISTS ethik_donations_852 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  network TEXT NOT NULL CHECK (network IN ('pix', 'btc', 'eth', 'sol', 'bnb', 'base', 'other')),
  tx_hash TEXT,
  amount_raw TEXT NOT NULL,
  amount_usd DECIMAL(12,6),
  donor_address TEXT,
  donor_name TEXT,
  -- Allocation split: 60% dev / 20% buyback / 20% reserve
  allocated_dev DECIMAL(12,6) GENERATED ALWAYS AS (amount_usd * 0.60) STORED,
  allocated_buyback DECIMAL(12,6) GENERATED ALWAYS AS (amount_usd * 0.20) STORED,
  allocated_reserve DECIMAL(12,6) GENERATED ALWAYS AS (amount_usd * 0.20) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ethik_donations_network ON ethik_donations_852(network);
CREATE INDEX IF NOT EXISTS idx_ethik_donations_created ON ethik_donations_852(created_at DESC);

-- 3. EGOS Points / ETHIK Scores (Fibonacci distribution)
CREATE TABLE IF NOT EXISTS ethik_scores_852 (
  user_id UUID PRIMARY KEY,
  permanent_score INTEGER DEFAULT 144,      -- F₁₂ = 144 (everyone starts equal)
  period_delta INTEGER DEFAULT 0,           -- Growth this period
  tier TEXT DEFAULT 'F3' CHECK (tier IN ('F3', 'F5', 'F8', 'F13', 'F21')),
  total_ethik_earned DECIMAL(18,8) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Distribution Periods (F₇ = 13-day cycles)
CREATE TABLE IF NOT EXISTS ethik_periods_852 (
  id SERIAL PRIMARY KEY,
  period_number INTEGER NOT NULL UNIQUE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_delta INTEGER DEFAULT 0,
  token_pool DECIMAL(18,8) DEFAULT 0,
  distributed BOOLEAN DEFAULT FALSE,
  distribution_tx TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Audit Trail (all point-earning actions)
CREATE TABLE IF NOT EXISTS ethik_actions_852 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'chat_message', 'report_shared', 'issue_created', 'issue_voted',
    'comment_posted', 'suggestion_submitted', 'donation_made',
    'token_purchased', 'code_contribution', 'bug_reported',
    'review_completed', 'moderation_action'
  )),
  points INTEGER NOT NULL CHECK (points BETWEEN 1 AND 21),  -- Max F₂₁ = 21
  reference_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ethik_actions_user ON ethik_actions_852(user_id);
CREATE INDEX IF NOT EXISTS idx_ethik_actions_type ON ethik_actions_852(action_type);
CREATE INDEX IF NOT EXISTS idx_ethik_actions_created ON ethik_actions_852(created_at DESC);

-- 6. Enable RLS
ALTER TABLE ethik_payments_852 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ethik_donations_852 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ethik_scores_852 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ethik_periods_852 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ethik_actions_852 ENABLE ROW LEVEL SECURITY;

-- Public read for scores and periods (transparency)
CREATE POLICY "Public read ethik_scores" ON ethik_scores_852
  FOR SELECT USING (true);

CREATE POLICY "Public read ethik_periods" ON ethik_periods_852
  FOR SELECT USING (true);

-- Service role full access for all tables
CREATE POLICY "Service full access payments" ON ethik_payments_852
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service full access donations" ON ethik_donations_852
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service full access scores" ON ethik_scores_852
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service full access periods" ON ethik_periods_852
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service full access actions" ON ethik_actions_852
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Views for dashboard
-- ============================================================================

-- Revenue summary
CREATE OR REPLACE VIEW ethik_revenue_summary_852 AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) AS tx_count,
  SUM(amount_usd) AS total_usd,
  api_endpoint,
  chain
FROM ethik_payments_852
WHERE status = 'confirmed'
GROUP BY day, api_endpoint, chain
ORDER BY day DESC;

-- Donation summary
CREATE OR REPLACE VIEW ethik_donation_summary_852 AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  network,
  COUNT(*) AS donation_count,
  SUM(amount_usd) AS total_usd,
  SUM(allocated_dev) AS total_dev,
  SUM(allocated_buyback) AS total_buyback,
  SUM(allocated_reserve) AS total_reserve
FROM ethik_donations_852
GROUP BY month, network
ORDER BY month DESC;
