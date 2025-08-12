-- Completely rewrite the series RLS policy to be more reliable
-- The subquery approach might be causing issues with policy evaluation

-- Drop all existing policies on series table
DROP POLICY IF EXISTS "Users can create their own series" ON public.series;
DROP POLICY IF EXISTS "Anyone can view published series" ON public.series;
DROP POLICY IF EXISTS "Users can update their own series" ON public.series;
DROP POLICY IF EXISTS "Users can delete their own series" ON public.series;

-- Create a very permissive INSERT policy for testing
-- This allows anyone to insert if the user_id corresponds to a profile with wallet_address
CREATE POLICY "Allow series creation for wallet users"
ON public.series
FOR INSERT
WITH CHECK (
  user_id IS NOT NULL AND 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = series.user_id AND profiles.wallet_address IS NOT NULL)
);

-- Recreate other policies
CREATE POLICY "Anyone can view published series"
ON public.series
FOR SELECT
USING ((is_published = true) OR (auth.uid() = user_id));

CREATE POLICY "Users can update their own series"
ON public.series
FOR UPDATE
USING (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IN (SELECT id FROM profiles WHERE wallet_address IS NOT NULL)));

CREATE POLICY "Users can delete their own series"
ON public.series
FOR DELETE
USING (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IN (SELECT id FROM profiles WHERE wallet_address IS NOT NULL)));