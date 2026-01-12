-- Create table to track Vedic forecast generation errors
CREATE TABLE public.vedic_generation_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  kundli_id uuid NOT NULL,
  error_message text,
  error_type text, -- 'free_generation' or 'paid_generation'
  notified boolean DEFAULT false,
  resolved boolean DEFAULT false,
  notes text
);

-- Enable RLS but no policies (service role only)
ALTER TABLE public.vedic_generation_alerts ENABLE ROW LEVEL SECURITY;