-- Drop existing overly permissive policies on theme_cache
DROP POLICY IF EXISTS "Service role can insert theme cache" ON public.theme_cache;
DROP POLICY IF EXISTS "Service role can select theme cache" ON public.theme_cache;

-- No new policies needed - service role bypasses RLS automatically
-- This effectively blocks all public/authenticated access while allowing edge functions to work