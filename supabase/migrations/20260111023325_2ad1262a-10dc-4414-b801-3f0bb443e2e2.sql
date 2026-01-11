CREATE TABLE public.vedic_sun_orientation_lookup (
  sun_sign TEXT PRIMARY KEY,
  default_orientation TEXT NOT NULL,
  identity_limit TEXT NOT NULL,
  effort_misfire TEXT NOT NULL
);

-- Enable RLS with public read access (lookup table)
ALTER TABLE public.vedic_sun_orientation_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vedic sun orientation is publicly readable"
ON public.vedic_sun_orientation_lookup
FOR SELECT
USING (true);