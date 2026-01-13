-- Add optional name column to user_kundli_details
ALTER TABLE public.user_kundli_details
ADD COLUMN name TEXT;