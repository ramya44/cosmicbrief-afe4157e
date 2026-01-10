-- Enable RLS on free_forecasts table to deny all direct client access
-- All operations (generation, retrieval, email updates) go through Edge Functions using service role
ALTER TABLE public.free_forecasts ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies are created intentionally
-- This means only the service role (used by edge functions) can access this table
-- Client-side queries will be denied, protecting sensitive PII

-- Also fix abuse_events table which has the same issue
ALTER TABLE public.abuse_events ENABLE ROW LEVEL SECURITY;

-- No policies for abuse_events either - admin/service role access only