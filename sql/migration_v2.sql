-- Migration v2: Telemetry + Reports + Admin Auth for 852 Inteligência
-- Project: lhscgsqhiooyatkebose
-- Date: 2026-03-10

-- ═══════════════════════════════════════════════════════════
-- 1. TELEMETRY TABLE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.telemetry_852 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  event_type TEXT NOT NULL,
  model_id TEXT,
  provider TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_usd NUMERIC(10, 6),
  duration_ms INTEGER,
  client_ip_hash TEXT,
  status_code INTEGER,
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_telemetry_852_created ON public.telemetry_852 (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_852_event ON public.telemetry_852 (event_type);

ALTER TABLE public.telemetry_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on telemetry_852" ON public.telemetry_852
  FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 2. REPORTS TABLE (server-side persistence)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.reports_852 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  conversation_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'shared', 'deleted')),
  messages JSONB NOT NULL DEFAULT '[]',
  review_data JSONB,
  session_hash TEXT,
  client_ip_hash TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_reports_852_status ON public.reports_852 (status);
CREATE INDEX IF NOT EXISTS idx_reports_852_created ON public.reports_852 (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_852_conv ON public.reports_852 (conversation_id);

ALTER TABLE public.reports_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on reports_852" ON public.reports_852
  FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 3. CONVERSATIONS TABLE (server-side persistence)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.conversations_852 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  session_hash TEXT,
  title TEXT,
  message_count INTEGER DEFAULT 0,
  messages JSONB NOT NULL DEFAULT '[]',
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_conversations_852_created ON public.conversations_852 (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_852_session ON public.conversations_852 (session_hash);

ALTER TABLE public.conversations_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on conversations_852" ON public.conversations_852
  FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 4. ADMIN USERS TABLE (email/password auth)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.admin_users_852 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_852_email ON public.admin_users_852 (email);

ALTER TABLE public.admin_users_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on admin_users_852" ON public.admin_users_852
  FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 5. ADMIN SESSIONS TABLE (JWT-less session management)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.admin_sessions_852 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  admin_id UUID REFERENCES public.admin_users_852(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_852_token ON public.admin_sessions_852 (token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_852_expires ON public.admin_sessions_852 (expires_at);

ALTER TABLE public.admin_sessions_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on admin_sessions_852" ON public.admin_sessions_852
  FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 6. INSIGHTS AGGREGATION VIEW
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.dashboard_852 AS
SELECT
  date_trunc('day', created_at) AS day,
  event_type,
  COUNT(*) AS event_count,
  SUM(tokens_in) AS total_tokens_in,
  SUM(tokens_out) AS total_tokens_out,
  SUM(cost_usd) AS total_cost,
  AVG(duration_ms) AS avg_duration_ms
FROM public.telemetry_852
WHERE created_at > now() - interval '30 days'
GROUP BY day, event_type
ORDER BY day DESC, event_type;
