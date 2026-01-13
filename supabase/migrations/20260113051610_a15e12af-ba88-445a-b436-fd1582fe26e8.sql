-- Add user_id column to user_kundli_details to link to authenticated users
ALTER TABLE public.user_kundli_details 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups by user_id
CREATE INDEX idx_user_kundli_details_user_id ON public.user_kundli_details(user_id);

-- Enable RLS on user_kundli_details (it wasn't enabled before)
ALTER TABLE public.user_kundli_details ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read kundli details (for shared links)
CREATE POLICY "Anyone can read kundli details"
ON public.user_kundli_details
FOR SELECT
USING (true);

-- Policy: Users can update their own kundli details
CREATE POLICY "Users can update their own kundli details"
ON public.user_kundli_details
FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Service role can insert (edge functions)
CREATE POLICY "Service role can insert kundli details"
ON public.user_kundli_details
FOR INSERT
WITH CHECK (true);