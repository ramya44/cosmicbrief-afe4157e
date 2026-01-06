-- Add token usage columns to paid_forecasts
ALTER TABLE public.paid_forecasts
ADD COLUMN prompt_tokens integer,
ADD COLUMN completion_tokens integer,
ADD COLUMN total_tokens integer;