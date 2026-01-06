-- Create theme_cache table for deterministic pivotal theme selection
CREATE TABLE public.theme_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  birth_date TEXT NOT NULL,
  birth_time_normalized TEXT NOT NULL,
  birth_place TEXT NOT NULL,
  target_year TEXT NOT NULL,
  pivotal_theme TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_theme_key UNIQUE (birth_date, birth_time_normalized, birth_place, target_year)
);

-- Enable Row Level Security
ALTER TABLE public.theme_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
CREATE POLICY "Service role can select theme cache"
ON public.theme_cache
FOR SELECT
USING (true);

CREATE POLICY "Service role can insert theme cache"
ON public.theme_cache
FOR INSERT
WITH CHECK (true);