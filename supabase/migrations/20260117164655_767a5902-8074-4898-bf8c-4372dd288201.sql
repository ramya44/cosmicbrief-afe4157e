-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can read kundli details" ON public.user_kundli_details;

-- Create secure policy: authenticated users can only view their own records
CREATE POLICY "Users can view own kundli details"
  ON public.user_kundli_details
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Explicitly deny anonymous direct access (edge function uses service role to bypass)
CREATE POLICY "Deny anonymous kundli access"
  ON public.user_kundli_details
  FOR SELECT
  TO anon
  USING (false);