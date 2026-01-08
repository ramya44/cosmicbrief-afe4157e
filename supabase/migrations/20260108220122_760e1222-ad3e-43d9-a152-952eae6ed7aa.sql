-- Add zodiac_sign column to free_forecasts
ALTER TABLE public.free_forecasts 
ADD COLUMN zodiac_sign TEXT;

-- Add zodiac_sign column to paid_forecasts
ALTER TABLE public.paid_forecasts 
ADD COLUMN zodiac_sign TEXT;