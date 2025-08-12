-- Fix RLS policy for series table to allow both authenticated users and wallet users to create series
-- The current policy is too restrictive for wallet users

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create their own series" ON public.series;

-- Create a new policy that allows creation for both authenticated users and wallet users
CREATE POLICY "Users can create their own series"
ON public.series
FOR INSERT
WITH CHECK (
  -- Allow if user is authenticated and creating for themselves
  (auth.uid() = user_id) 
  OR 
  -- Allow if no auth session but this is a wallet user creating a series
  -- Check that the user_id corresponds to a valid profile with a wallet_address
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = series.user_id 
    AND profiles.wallet_address IS NOT NULL
  ))
);