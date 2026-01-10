-- Add shareable_link column to paid_forecasts table
ALTER TABLE public.paid_forecasts 
ADD COLUMN shareable_link text GENERATED ALWAYS AS (
  'https://cosmicbrief.com/#/results?forecastId=' || id::text || '&guestToken=' || COALESCE(guest_token::text, '')
) STORED;