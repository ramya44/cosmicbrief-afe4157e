CREATE TABLE public.vedic_moon_pacing_lookup (
  moon_sign TEXT PRIMARY KEY,
  emotional_pacing TEXT NOT NULL,
  sensitivity_point TEXT NOT NULL,
  strain_leak TEXT NOT NULL
);

-- Enable RLS with public read access (lookup table)
ALTER TABLE public.vedic_moon_pacing_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vedic moon pacing is publicly readable"
ON public.vedic_moon_pacing_lookup
FOR SELECT
USING (true);