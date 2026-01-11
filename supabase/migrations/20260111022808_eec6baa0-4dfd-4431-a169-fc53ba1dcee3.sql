CREATE TABLE public.nakshatra_pressure_lookup (
  nakshatra TEXT PRIMARY KEY,
  intensity_reason TEXT NOT NULL,
  moral_cost_limit TEXT NOT NULL,
  strain_accumulation TEXT NOT NULL
);

-- Enable RLS (no policies = service role only access)
ALTER TABLE public.nakshatra_pressure_lookup ENABLE ROW LEVEL SECURITY;

-- Add read-only policy for public access (lookup table)
CREATE POLICY "Nakshatra lookup is publicly readable"
ON public.nakshatra_pressure_lookup
FOR SELECT
USING (true);