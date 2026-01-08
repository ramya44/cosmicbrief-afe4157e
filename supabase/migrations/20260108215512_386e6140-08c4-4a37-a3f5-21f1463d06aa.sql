-- Create zodiac signs reference table
CREATE TABLE public.zodiac_signs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  start_month INTEGER NOT NULL,
  start_day INTEGER NOT NULL,
  end_month INTEGER NOT NULL,
  end_day INTEGER NOT NULL
);

-- Insert zodiac sign data
INSERT INTO public.zodiac_signs (name, start_month, start_day, end_month, end_day) VALUES
  ('Aries', 3, 21, 4, 19),
  ('Taurus', 4, 20, 5, 20),
  ('Gemini', 5, 21, 6, 20),
  ('Cancer', 6, 21, 7, 22),
  ('Leo', 7, 23, 8, 22),
  ('Virgo', 8, 23, 9, 22),
  ('Libra', 9, 23, 10, 22),
  ('Scorpio', 10, 23, 11, 21),
  ('Sagittarius', 11, 22, 12, 21),
  ('Capricorn', 12, 22, 1, 19),
  ('Aquarius', 1, 20, 2, 18),
  ('Pisces', 2, 19, 3, 20);

-- Enable RLS (public read access for reference data)
ALTER TABLE public.zodiac_signs ENABLE ROW LEVEL SECURITY;

-- Allow public read access since this is static reference data
CREATE POLICY "Zodiac signs are publicly readable"
  ON public.zodiac_signs
  FOR SELECT
  USING (true);