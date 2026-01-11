-- Add summary_interpretation column to both lookup tables
ALTER TABLE public.vedic_sun_orientation_lookup
ADD COLUMN summary_interpretation text;

ALTER TABLE public.vedic_moon_pacing_lookup
ADD COLUMN summary_interpretation text;