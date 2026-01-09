-- Add device_id column to free_forecasts (nullable, no constraints)
ALTER TABLE public.free_forecasts 
ADD COLUMN device_id text;

-- Add device_id column to paid_forecasts (nullable, no constraints)
ALTER TABLE public.paid_forecasts 
ADD COLUMN device_id text;