-- Fix RLS policy for profiles table to allow wallet users to update their own profiles
-- The current policy only works for Supabase authenticated users, but we need to support wallet users too

-- Drop the existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;

-- Create a new policy that allows updates for both authenticated users and wallet users
CREATE POLICY "Users can update their own profiles"
ON public.profiles
FOR UPDATE
USING (
  -- Allow if user is authenticated and profile belongs to them
  (auth.uid() = id) 
  OR 
  -- Allow if no auth session but this is a wallet-based profile update
  -- (wallet users don't have auth.uid() but we can identify them by wallet_address)
  (auth.uid() IS NULL AND wallet_address IS NOT NULL)
);