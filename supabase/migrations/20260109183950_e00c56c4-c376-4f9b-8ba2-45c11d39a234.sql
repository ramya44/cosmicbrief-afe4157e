-- Add unique constraint on stripe_session_id to prevent replay attacks
-- The column already has data, so we use CREATE UNIQUE INDEX which handles this cleanly
ALTER TABLE public.paid_forecasts 
ADD CONSTRAINT paid_forecasts_stripe_session_id_unique UNIQUE (stripe_session_id);