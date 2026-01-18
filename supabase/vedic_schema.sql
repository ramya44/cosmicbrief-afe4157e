-- ============================================
-- COSMIC BRIEF - VEDIC ASTROLOGY SCHEMA
-- Clean schema for new Supabase project
-- ============================================

-- ============================================
-- 1. PROFILES TABLE (for user authentication)
-- ============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profile timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. USER KUNDLI DETAILS TABLE (main vedic data)
-- ============================================
CREATE TABLE public.user_kundli_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core birth input
  name TEXT,
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  birth_place TEXT NOT NULL,
  birth_time_utc TIMESTAMP WITH TIME ZONE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  email TEXT,
  device_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

  -- Ascendant (Lagna)
  ascendant TEXT,
  ascendant_id INTEGER,
  ascendant_lord TEXT,

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
  dasha_periods JSONB,

  -- Planetary positions
  planetary_positions JSONB,

  -- Free vedic forecast
  free_vedic_forecast TEXT,

  -- Paid vedic forecast
  paid_vedic_forecast TEXT,
  stripe_session_id TEXT UNIQUE,
  paid_amount INTEGER,
  paid_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.user_kundli_details ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read kundli details (for shared links)
CREATE POLICY "Anyone can read kundli details"
ON public.user_kundli_details
FOR SELECT
USING (true);

-- Policy: Authenticated users can update their own kundli details
CREATE POLICY "Authenticated users can update their own kundli details"
ON public.user_kundli_details
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can insert (edge functions)
CREATE POLICY "Service role can insert kundli details"
ON public.user_kundli_details
FOR INSERT
WITH CHECK (true);

-- Indexes
CREATE INDEX idx_user_kundli_details_email ON public.user_kundli_details(email);
CREATE INDEX idx_user_kundli_details_user_id ON public.user_kundli_details(user_id);
CREATE INDEX idx_user_kundli_details_created_at ON public.user_kundli_details(created_at DESC);

-- ============================================
-- 3. LOOKUP TABLES
-- ============================================

-- Vedic Zodiac Signs
CREATE TABLE public.vedic_zodiac_signs (
  id INT PRIMARY KEY,
  sanskrit_name VARCHAR(50) NOT NULL,
  western_name VARCHAR(50) NOT NULL,
  literal_meaning VARCHAR(100),
  image_url TEXT
);

ALTER TABLE public.vedic_zodiac_signs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vedic zodiac signs are publicly readable"
ON public.vedic_zodiac_signs
FOR SELECT
USING (true);

-- Nakshatra Animal Lookup
CREATE TABLE public.nakshatra_animal_lookup (
  nakshatra_animal TEXT PRIMARY KEY,
  phrase TEXT NOT NULL,
  image_url TEXT
);

ALTER TABLE public.nakshatra_animal_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nakshatra animals are publicly readable"
ON public.nakshatra_animal_lookup
FOR SELECT
USING (true);

-- Nakshatra Pressure Lookup
CREATE TABLE public.nakshatra_pressure_lookup (
  nakshatra TEXT PRIMARY KEY,
  intensity_reason TEXT NOT NULL,
  moral_cost_limit TEXT NOT NULL,
  strain_accumulation TEXT NOT NULL
);

ALTER TABLE public.nakshatra_pressure_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nakshatra lookup is publicly readable"
ON public.nakshatra_pressure_lookup
FOR SELECT
USING (true);

-- Vedic Sun Orientation Lookup
CREATE TABLE public.vedic_sun_orientation_lookup (
  sun_sign TEXT PRIMARY KEY,
  default_orientation TEXT NOT NULL,
  identity_limit TEXT NOT NULL,
  effort_misfire TEXT NOT NULL
);

ALTER TABLE public.vedic_sun_orientation_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vedic sun orientation is publicly readable"
ON public.vedic_sun_orientation_lookup
FOR SELECT
USING (true);

-- Vedic Moon Pacing Lookup
CREATE TABLE public.vedic_moon_pacing_lookup (
  moon_sign TEXT PRIMARY KEY,
  emotional_pacing TEXT NOT NULL,
  sensitivity_point TEXT NOT NULL,
  strain_leak TEXT NOT NULL
);

ALTER TABLE public.vedic_moon_pacing_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vedic moon pacing is publicly readable"
ON public.vedic_moon_pacing_lookup
FOR SELECT
USING (true);

-- Transits Lookup (multi-year support)
CREATE TABLE public.transits_lookup (
  id TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT 2026,
  transit_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id, year)
);

ALTER TABLE public.transits_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read transits lookup"
ON public.transits_lookup
FOR SELECT
USING (true);

-- Insert 2026 transits data
INSERT INTO public.transits_lookup (id, year, transit_data) VALUES
('rahu_ketu', 2026, '{
  "shift_date": "2026-01-18",
  "rahu_sign": "Aquarius",
  "rahu_sign_sanskrit": "Kumbha",
  "ketu_sign": "Leo",
  "ketu_sign_sanskrit": "Simha",
  "duration": "18 months (Jan 2026 - July 2027)"
}'::jsonb),

('jupiter', 2026, '[
  {
    "sign": "Taurus",
    "sign_sanskrit": "Vrishabha",
    "start": "2026-01-01",
    "end": "2026-05-01",
    "notes": "Direct motion"
  },
  {
    "sign": "Taurus",
    "sign_sanskrit": "Vrishabha",
    "start": "2026-05-01",
    "end": "2026-08-01",
    "notes": "Retrograde"
  },
  {
    "sign": "Gemini",
    "sign_sanskrit": "Mithuna",
    "start": "2026-08-01",
    "end": "2026-12-31",
    "notes": "Direct motion"
  }
]'::jsonb),

('saturn', 2026, '{
  "sign": "Aquarius",
  "sign_sanskrit": "Kumbha",
  "start": "2023-01-17",
  "end": "2027-03-29",
  "notes": "In Aquarius all of 2026"
}'::jsonb),

('eclipses', 2026, '[
  {
    "date": "2026-03-03",
    "type": "Total Solar Eclipse",
    "sign": "Aquarius",
    "degree": 19.4
  },
  {
    "date": "2026-03-17",
    "type": "Total Lunar Eclipse",
    "sign": "Leo",
    "degree": 3.9
  },
  {
    "date": "2026-08-28",
    "type": "Partial Solar Eclipse",
    "sign": "Leo",
    "degree": 11.1
  },
  {
    "date": "2026-09-11",
    "type": "Total Lunar Eclipse",
    "sign": "Aquarius",
    "degree": 24.7
  }
]'::jsonb),

('mercury_retrograde', 2026, '[
  {
    "start": "2026-02-10",
    "end": "2026-03-04",
    "signs": ["Pisces", "Aquarius"]
  },
  {
    "start": "2026-06-10",
    "end": "2026-07-03",
    "signs": ["Cancer", "Gemini"]
  },
  {
    "start": "2026-10-07",
    "end": "2026-10-28",
    "signs": ["Scorpio", "Libra"]
  }
]'::jsonb);

-- ============================================
-- 4. VEDIC GENERATION ALERTS (error tracking)
-- ============================================
CREATE TABLE public.vedic_generation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  kundli_id UUID NOT NULL,
  error_message TEXT,
  error_type TEXT, -- 'free_generation' or 'paid_generation'
  notified BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  notes TEXT
);

ALTER TABLE public.vedic_generation_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. WEEKLY HOROSCOPE SUBSCRIBERS
-- ============================================
CREATE TABLE public.weekly_horoscope_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  kundli_id UUID REFERENCES public.user_kundli_details(id),
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.weekly_horoscope_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to weekly horoscope"
ON public.weekly_horoscope_subscribers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their subscription by email"
ON public.weekly_horoscope_subscribers
FOR SELECT
USING (true);

CREATE INDEX idx_weekly_horoscope_subscribers_email ON public.weekly_horoscope_subscribers(email);

-- ============================================
-- DONE!
-- Tables created:
-- 1. profiles
-- 2. user_kundli_details
-- 3. vedic_zodiac_signs
-- 4. nakshatra_animal_lookup
-- 5. nakshatra_pressure_lookup
-- 6. vedic_sun_orientation_lookup
-- 7. vedic_moon_pacing_lookup
-- 8. transits_lookup
-- 9. vedic_generation_alerts
-- 10. weekly_horoscope_subscribers
-- ============================================
