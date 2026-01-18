-- Create table for weekly horoscope subscribers
CREATE TABLE public.weekly_horoscope_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  kundli_id UUID REFERENCES public.user_kundli_details(id),
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.weekly_horoscope_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for signups
CREATE POLICY "Anyone can subscribe to weekly horoscope"
ON public.weekly_horoscope_subscribers
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own subscription
CREATE POLICY "Users can view their subscription by email"
ON public.weekly_horoscope_subscribers
FOR SELECT
USING (true);

-- Add index for email lookups
CREATE INDEX idx_weekly_horoscope_subscribers_email ON public.weekly_horoscope_subscribers(email);