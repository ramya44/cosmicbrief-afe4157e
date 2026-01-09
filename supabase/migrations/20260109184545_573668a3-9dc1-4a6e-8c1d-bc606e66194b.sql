-- Remove existing SELECT policy - all reads will go through edge functions with guest_token validation
DROP POLICY IF EXISTS "Users can view their own free forecasts" ON public.free_forecasts;

-- Verify RLS is enabled (it already is, but this is a no-op safety check)
ALTER TABLE public.free_forecasts ENABLE ROW LEVEL SECURITY;

-- No policies = deny all client access
-- Edge functions use service role key to bypass RLS
-- This ensures:
-- 1. No direct client reads (must use get-forecast endpoint with guest_token)
-- 2. No direct client inserts (must use generate-forecast endpoint)
-- 3. No direct client updates (must use update-free-forecast-email endpoint)