-- Fix RLS policies for profiles table to ensure proper access
-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON public.profiles;

-- Create new, clearer RLS policies
-- Allow everyone to read public profile data
CREATE POLICY "Public read access to profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Allow users to insert their own profiles (both auth users and wallet users)
CREATE POLICY "Users can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = id) OR 
  (auth.uid() IS NULL AND wallet_address IS NOT NULL)
);

-- Allow users to update their own profiles (both auth users and wallet users)
CREATE POLICY "Users can update own profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = id) OR 
  (auth.uid() IS NULL AND wallet_address IS NOT NULL)
);

-- Allow users to delete their own profiles (both auth users and wallet users)
CREATE POLICY "Users can delete own profiles" 
ON public.profiles 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = id) OR 
  (auth.uid() IS NULL AND wallet_address IS NOT NULL)
);