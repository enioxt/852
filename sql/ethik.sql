-- ETHIK Token Distribution & Gamification Schema

-- Contributors who register their wallet for ETHIK distribution
CREATE TABLE public.ethik_contributors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  github_username TEXT UNIQUE,
  wallet_address TEXT,
  display_name TEXT,
  total_points INTEGER DEFAULT 0,
  penalty_score NUMERIC(5,2) DEFAULT 0,
  penalty_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Point transactions (immutable ledger)
CREATE TABLE public.ethik_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  contributor_id UUID REFERENCES public.ethik_contributors(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('commit', 'pr', 'issue', 'star', 'chat_report', 'referral', 'bonus', 'penalty')),
  description TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Penalty contests (user can contest once, their word is final)
CREATE TABLE public.ethik_contests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  contributor_id UUID REFERENCES public.ethik_contributors(id) ON DELETE CASCADE,
  penalty_transaction_id UUID REFERENCES public.ethik_transactions(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('accepted')),
  -- No 'rejected' status: if user contests, it's always accepted (truth is what matters)
  resolved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Distribution events (airdrops)
CREATE TABLE public.ethik_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  total_tokens NUMERIC(18,8) NOT NULL,
  snapshot_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'distributed', 'cancelled'))
);

-- RLS
ALTER TABLE public.ethik_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ethik_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ethik_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ethik_distributions ENABLE ROW LEVEL SECURITY;

-- Public read for leaderboard
CREATE POLICY "Public read leaderboard" ON public.ethik_contributors FOR SELECT USING (true);
CREATE POLICY "Public read transactions" ON public.ethik_transactions FOR SELECT USING (true);

-- Insert policies (via service role / API only)
CREATE POLICY "Service insert contributors" ON public.ethik_contributors FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert transactions" ON public.ethik_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert contests" ON public.ethik_contests FOR INSERT WITH CHECK (true);
