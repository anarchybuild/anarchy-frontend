-- Drop the existing restrictive INSERT policy for series
DROP POLICY IF EXISTS "Users can create their own series" ON public.series;

-- Create a new policy that allows both Supabase auth users and wallet users
CREATE POLICY "Users can create their own series" ON public.series
FOR INSERT 
WITH CHECK (
  -- Allow Supabase authenticated users
  (auth.uid() = user_id) 
  OR 
  -- Allow wallet users who have a profile (when no Supabase auth)
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_id
  ))
);