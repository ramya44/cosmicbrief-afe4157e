-- Add shareable_link column to user_kundli_details
-- The link will be computed by edge functions based on payment status
ALTER TABLE public.user_kundli_details
ADD COLUMN shareable_link text;