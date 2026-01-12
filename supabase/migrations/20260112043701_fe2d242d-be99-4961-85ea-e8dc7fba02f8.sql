-- Create lookup table for 2026 major planetary transits
CREATE TABLE public.transits_2026_lookup (
  id TEXT PRIMARY KEY,
  transit_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read access for reference data)
ALTER TABLE public.transits_2026_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read transits lookup"
ON public.transits_2026_lookup
FOR SELECT
USING (true);

-- Insert the 2026 transits data
INSERT INTO public.transits_2026_lookup (id, transit_data) VALUES
('rahu_ketu', '{
  "shift_date": "2026-01-18",
  "rahu_sign": "Aquarius",
  "rahu_sign_sanskrit": "Kumbha",
  "ketu_sign": "Leo",
  "ketu_sign_sanskrit": "Simha",
  "duration": "18 months (Jan 2026 - July 2027)"
}'::jsonb),

('jupiter', '[
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

('saturn', '{
  "sign": "Aquarius",
  "sign_sanskrit": "Kumbha",
  "start": "2023-01-17",
  "end": "2027-03-29",
  "notes": "In Aquarius all of 2026"
}'::jsonb),

('eclipses_2026', '[
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

('mars_retrograde', 'null'::jsonb),

('mercury_retrograde', '[
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