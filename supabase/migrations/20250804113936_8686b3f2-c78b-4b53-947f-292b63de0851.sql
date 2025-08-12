-- Drop the existing INSERT policy for series
DROP POLICY IF EXISTS "Users can create their own series" ON public.series;

-- Create a more permissive policy that allows wallet users to create series
CREATE POLICY "Users can create their own series" ON public.series
FOR INSERT 
WITH CHECK (
  -- Allow any user with a valid profile (covers both Supabase and wallet users)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = series.user_id
  )
);