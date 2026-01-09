-- Remove rising sign columns from free_forecasts table
ALTER TABLE public.free_forecasts DROP COLUMN IF EXISTS rising_sign;
ALTER TABLE public.free_forecasts DROP COLUMN IF EXISTS rising_sign_id;