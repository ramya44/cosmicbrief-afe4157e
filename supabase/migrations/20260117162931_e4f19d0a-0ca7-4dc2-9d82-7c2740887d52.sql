-- Fix MISSING_RLS: Unauthorized modification of customer kundli records
-- Remove the permissive UPDATE policy that allows anyone to modify records where user_id IS NULL

-- Step 1: Drop the permissive policy
DROP POLICY IF EXISTS "Users can update their own kundli details" ON public.user_kundli_details;

-- Step 2: Create secure UPDATE policy for authenticated users only
-- Anonymous users should NOT be able to update records directly from the client
-- All anonymous updates must go through edge functions that validate device_id
CREATE POLICY "Authenticated users can update their own kundli details"
ON public.user_kundli_details
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);