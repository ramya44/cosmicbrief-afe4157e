-- Drop the old theme_cache table and recreate with UTC-based columns
DROP TABLE IF EXISTS public.theme_cache;

CREATE TABLE public.theme_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  birth_datetime_utc timestamp with time zone NOT NULL,
  target_year text NOT NULL,
  pivotal_theme text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(birth_datetime_utc, target_year)
);

-- Enable RLS
ALTER TABLE public.theme_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
CREATE POLICY "Service role can insert theme cache"
ON public.theme_cache
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can select theme cache"
ON public.theme_cache
FOR SELECT
USING (true);