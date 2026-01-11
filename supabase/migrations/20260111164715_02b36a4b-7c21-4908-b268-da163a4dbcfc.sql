-- Add model_used column to free_forecasts table
ALTER TABLE public.free_forecasts 
ADD COLUMN model_used text;