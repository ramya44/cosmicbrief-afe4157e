-- Add columns to track generation attempts, model used, and status
ALTER TABLE public.paid_forecasts 
ADD COLUMN IF NOT EXISTS model_used text,
ADD COLUMN IF NOT EXISTS generation_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS generation_error text,
ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;