-- Add forecast columns to user_kundli_details table
ALTER TABLE public.user_kundli_details
ADD COLUMN free_vedic_forecast TEXT,
ADD COLUMN forecast_model TEXT,
ADD COLUMN forecast_generated_at TIMESTAMP WITH TIME ZONE;