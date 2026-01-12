
-- Rename the table
ALTER TABLE public.transits_2026_lookup RENAME TO transits_lookup;

-- Add year column with default 2026
ALTER TABLE public.transits_lookup ADD COLUMN year INTEGER NOT NULL DEFAULT 2026;

-- Update years based on id patterns
UPDATE public.transits_lookup SET year = 2025 WHERE id LIKE '%_2025';
UPDATE public.transits_lookup SET year = 2026 WHERE id LIKE '%_2026';

-- Drop the existing primary key constraint
ALTER TABLE public.transits_lookup DROP CONSTRAINT transits_2026_lookup_pkey;

-- Create composite primary key with id and year
ALTER TABLE public.transits_lookup ADD PRIMARY KEY (id, year);

-- Now clean up the ids by removing year suffixes
UPDATE public.transits_lookup SET id = 'rahu_ketu' WHERE id = 'rahu_ketu_2025';
UPDATE public.transits_lookup SET id = 'jupiter' WHERE id = 'jupiter_2025';
UPDATE public.transits_lookup SET id = 'saturn' WHERE id = 'saturn_2025';
UPDATE public.transits_lookup SET id = 'eclipses' WHERE id = 'eclipses_2026';
