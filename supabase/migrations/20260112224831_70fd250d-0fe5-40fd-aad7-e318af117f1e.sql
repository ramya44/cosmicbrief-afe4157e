-- Add token tracking columns for Vedic forecasts
ALTER TABLE public.user_kundli_details
ADD COLUMN free_prompt_tokens integer,
ADD COLUMN free_completion_tokens integer,
ADD COLUMN paid_prompt_tokens integer,
ADD COLUMN paid_completion_tokens integer;