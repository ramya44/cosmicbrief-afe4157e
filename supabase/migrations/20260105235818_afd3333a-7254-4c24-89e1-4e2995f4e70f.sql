-- Create paid_forecasts table to store both free and strategic forecasts
CREATE TABLE public.paid_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text UNIQUE NOT NULL,
  customer_email text NOT NULL,
  customer_name text,
  birth_date text NOT NULL,
  birth_time text NOT NULL,
  birth_place text NOT NULL,
  free_forecast text NOT NULL,
  strategic_forecast jsonb NOT NULL,
  amount_paid integer DEFAULT 2000,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paid_forecasts ENABLE ROW LEVEL SECURITY;

-- Allow service role (edge functions) to manage forecasts
CREATE POLICY "Service role can insert forecasts"
  ON public.paid_forecasts
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select forecasts"
  ON public.paid_forecasts
  FOR SELECT
  TO service_role
  USING (true);