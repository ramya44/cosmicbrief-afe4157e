-- Allow service role to update paid_forecasts (for linking to user)
CREATE POLICY "Service role can update paid forecasts"
ON public.paid_forecasts FOR UPDATE
USING (true)
WITH CHECK (true);