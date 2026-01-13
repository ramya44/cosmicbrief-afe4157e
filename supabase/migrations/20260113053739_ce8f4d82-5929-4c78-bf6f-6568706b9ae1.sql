-- Create vedic zodiac signs lookup table
CREATE TABLE public.vedic_zodiac_signs (
  id INT PRIMARY KEY,
  sanskrit_name VARCHAR(50) NOT NULL,
  western_name VARCHAR(50) NOT NULL,
  literal_meaning VARCHAR(100),
  image_url TEXT
);

-- Enable RLS
ALTER TABLE public.vedic_zodiac_signs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Vedic zodiac signs are publicly readable"
ON public.vedic_zodiac_signs
FOR SELECT
USING (true);