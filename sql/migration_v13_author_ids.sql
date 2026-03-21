-- 1. Extend issues_852 with author identity
ALTER TABLE public.issues_852
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.user_accounts_852(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version_author_id UUID REFERENCES public.user_accounts_852(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version_reason TEXT;
