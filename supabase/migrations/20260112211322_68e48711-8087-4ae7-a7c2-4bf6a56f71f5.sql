-- Add columns for paid Vedic forecast
ALTER TABLE public.user_kundli_details 
ADD COLUMN IF NOT EXISTS paid_vedic_forecast TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS paid_amount INTEGER,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;