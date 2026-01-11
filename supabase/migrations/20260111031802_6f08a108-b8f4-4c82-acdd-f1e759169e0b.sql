-- Add summary_interpretation column to nakshatra_pressure_lookup
ALTER TABLE public.nakshatra_pressure_lookup
ADD COLUMN summary_interpretation text;