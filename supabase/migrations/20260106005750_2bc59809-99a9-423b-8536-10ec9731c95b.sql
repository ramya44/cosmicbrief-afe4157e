-- Create table for free forecasts
CREATE TABLE public.free_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  birth_place TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  forecast_text TEXT NOT NULL,
  pivotal_theme TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.free_forecasts ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert and update forecasts
CREATE POLICY "Service role can insert free forecasts"
ON public.free_forecasts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can select free forecasts"
ON public.free_forecasts
FOR SELECT
USING (true);

CREATE POLICY "Service role can update free forecasts"
ON public.free_forecasts
FOR UPDATE
USING (true);