-- Add birth_time_utc column to free_forecasts table
ALTER TABLE public.free_forecasts
ADD COLUMN birth_time_utc TIMESTAMP WITH TIME ZONE;

-- Add birth_time_utc column to paid_forecasts table
ALTER TABLE public.paid_forecasts
ADD COLUMN birth_time_utc TIMESTAMP WITH TIME ZONE;