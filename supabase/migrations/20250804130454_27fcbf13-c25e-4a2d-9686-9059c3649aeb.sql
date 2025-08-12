-- Fix the series RLS policy to properly handle wallet users
-- The current policy logic might have evaluation issues

-- Drop the current policy
DROP POLICY IF EXISTS "Users can create their own series" ON public.series;

-- Create a more explicit policy that handles both cases clearly
CREATE POLICY "Users can create their own series"
ON public.series
FOR INSERT
WITH CHECK (
  -- Case 1: Authenticated Supabase user creating for themselves
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Case 2: Wallet user (no auth session) creating series
  -- Check that user_id corresponds to a valid wallet profile
  (auth.uid() IS NULL AND user_id IN (
    SELECT id FROM profiles WHERE wallet_address IS NOT NULL
  ))
);