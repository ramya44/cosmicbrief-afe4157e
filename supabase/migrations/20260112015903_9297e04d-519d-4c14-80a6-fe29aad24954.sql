-- Add column for 2026-specific dasha periods
ALTER TABLE public.user_kundli_details
ADD COLUMN dasha_periods_2026 jsonb;