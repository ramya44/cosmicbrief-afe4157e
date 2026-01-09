-- Create abuse_events table for tracking and alerting
CREATE TABLE public.abuse_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  ip_address TEXT,
  device_id TEXT,
  details JSONB,
  hourly_count INTEGER,
  threshold INTEGER,
  notified BOOLEAN DEFAULT false
);

-- Enable RLS (only service role can write/read)
ALTER TABLE public.abuse_events ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can interact with this table
-- This is intentional - abuse events should only be managed by edge functions