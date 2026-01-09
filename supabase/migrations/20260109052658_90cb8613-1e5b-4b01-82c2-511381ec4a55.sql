-- Drop existing overly permissive policies on free_forecasts
DROP POLICY IF EXISTS "Service role can insert free forecasts" ON public.free_forecasts;
DROP POLICY IF EXISTS "Service role can select free forecasts" ON public.free_forecasts;
DROP POLICY IF EXISTS "Service role can update free forecasts" ON public.free_forecasts;

-- Create restrictive policies that only allow authenticated users to see their own data (if they have an email match)
-- Note: Service role always bypasses RLS, so edge functions will continue to work

-- No public SELECT access - only service role (via edge functions) can read
-- If users need to see their own forecasts in the future, they can be matched by email after authentication
CREATE POLICY "Users can view their own free forecasts"
ON public.free_forecasts
FOR SELECT
TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- No public INSERT - only service role can insert (via edge functions)
-- No policy needed for anon/authenticated since we want to block direct inserts

-- No public UPDATE - only service role can update (via edge functions)
-- No policy needed for anon/authenticated since we want to block direct updates