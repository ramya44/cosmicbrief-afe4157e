-- Add guest_token column to free_forecasts for anonymous access control
ALTER TABLE public.free_forecasts 
ADD COLUMN guest_token uuid DEFAULT gen_random_uuid();

-- Add guest_token column to paid_forecasts for anonymous access control  
ALTER TABLE public.paid_forecasts
ADD COLUMN guest_token uuid DEFAULT gen_random_uuid();

-- Create indexes for efficient lookups
CREATE INDEX idx_free_forecasts_guest_token ON public.free_forecasts(guest_token);
CREATE INDEX idx_paid_forecasts_guest_token ON public.paid_forecasts(guest_token);