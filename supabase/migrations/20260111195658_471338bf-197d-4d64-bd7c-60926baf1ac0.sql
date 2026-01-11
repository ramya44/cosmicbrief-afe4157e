-- Create nakshatra animals lookup table
CREATE TABLE public.nakshatra_animal_lookup (
  nakshatra_animal TEXT PRIMARY KEY,
  phrase TEXT NOT NULL,
  image_url TEXT
);

-- Enable RLS
ALTER TABLE public.nakshatra_animal_lookup ENABLE ROW LEVEL SECURITY;

-- Make it publicly readable
CREATE POLICY "Nakshatra animals are publicly readable"
ON public.nakshatra_animal_lookup
FOR SELECT
USING (true);