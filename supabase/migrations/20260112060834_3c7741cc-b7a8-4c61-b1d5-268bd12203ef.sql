-- Drop mangal dosha columns
ALTER TABLE public.user_kundli_details DROP COLUMN IF EXISTS has_mangal_dosha;
ALTER TABLE public.user_kundli_details DROP COLUMN IF EXISTS has_mangal_exception;
ALTER TABLE public.user_kundli_details DROP COLUMN IF EXISTS mangal_dosha_description;
ALTER TABLE public.user_kundli_details DROP COLUMN IF EXISTS mangal_dosha_type;
ALTER TABLE public.user_kundli_details DROP COLUMN IF EXISTS mangal_dosha_exceptions;
ALTER TABLE public.user_kundli_details DROP COLUMN IF EXISTS mangal_dosha_remedies;

-- Drop yoga columns
ALTER TABLE public.user_kundli_details DROP COLUMN IF EXISTS major_yogas;
ALTER TABLE public.user_kundli_details DROP COLUMN IF EXISTS chandra_yogas;
ALTER TABLE public.user_kundli_details DROP COLUMN IF EXISTS soorya_yogas;
ALTER TABLE public.user_kundli_details DROP COLUMN IF EXISTS inauspicious_yogas;

-- Add planetary positions as JSONB (stores all 9 planets + ascendant with sign, degree, nakshatra, retrograde status)
ALTER TABLE public.user_kundli_details ADD COLUMN IF NOT EXISTS planetary_positions JSONB;

-- Add ascendant (lagna) columns
ALTER TABLE public.user_kundli_details ADD COLUMN IF NOT EXISTS ascendant_sign TEXT;
ALTER TABLE public.user_kundli_details ADD COLUMN IF NOT EXISTS ascendant_sign_id INTEGER;
ALTER TABLE public.user_kundli_details ADD COLUMN IF NOT EXISTS ascendant_sign_lord TEXT;