-- Create table for storing Advanced Kundli details
CREATE TABLE public.user_kundli_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core birth input
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  birth_place TEXT NOT NULL,
  birth_time_utc TIMESTAMP WITH TIME ZONE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  email TEXT,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Basic Vedic data
  moon_sign TEXT,
  moon_sign_id INTEGER,
  moon_sign_lord TEXT,
  sun_sign TEXT,
  sun_sign_id INTEGER,
  sun_sign_lord TEXT,
  nakshatra TEXT,
  nakshatra_id INTEGER,
  nakshatra_pada INTEGER,
  nakshatra_lord TEXT,
  nakshatra_gender TEXT,
  deity TEXT,
  ganam TEXT,
  birth_symbol TEXT,
  animal_sign TEXT,
  nadi TEXT,
  lucky_color TEXT,
  best_direction TEXT,
  syllables TEXT,
  birth_stone TEXT,
  zodiac_sign TEXT,
  
  -- Mangal Dosha
  has_mangal_dosha BOOLEAN,
  mangal_dosha_description TEXT,
  has_mangal_exception BOOLEAN,
  mangal_dosha_type TEXT,
  mangal_dosha_exceptions JSONB,
  mangal_dosha_remedies JSONB,
  
  -- Yoga details (JSONB for flexibility)
  major_yogas JSONB,
  chandra_yogas JSONB,
  soorya_yogas JSONB,
  inauspicious_yogas JSONB,
  
  -- Dasha periods
  dasha_periods JSONB
);

-- Enable RLS (edge functions use service role)
ALTER TABLE public.user_kundli_details ENABLE ROW LEVEL SECURITY;

-- Add index on email for lookups
CREATE INDEX idx_user_kundli_details_email ON public.user_kundli_details(email);

-- Add index on created_at for ordering
CREATE INDEX idx_user_kundli_details_created_at ON public.user_kundli_details(created_at DESC);