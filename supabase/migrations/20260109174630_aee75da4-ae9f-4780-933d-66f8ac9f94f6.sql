-- Drop redundant service role policies from paid_forecasts
-- Service role bypasses RLS by default, so these policies are not needed
-- and they trigger Supabase linter warnings for USING(true)/WITH CHECK(true)

DROP POLICY IF EXISTS "Service role can insert forecasts" ON public.paid_forecasts;
DROP POLICY IF EXISTS "Service role can select forecasts" ON public.paid_forecasts;
DROP POLICY IF EXISTS "Service role can update paid forecasts" ON public.paid_forecasts;

-- The "Users can view their own paid forecasts" policy remains for authenticated users
-- Service role access is maintained through built-in Supabase behavior (bypasses RLS)