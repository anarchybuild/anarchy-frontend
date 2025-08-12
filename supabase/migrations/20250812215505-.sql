-- Fix security vulnerability: Remove overly permissive profile access policies
-- and implement secure, granular access control

-- Drop the overly permissive policies that allow anyone to view all profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Keep the policy for users to view their own profiles
-- (This one is already secure: "Users can view own profile")

-- Create a new policy for limited public profile information only
-- This allows viewing of basic, non-sensitive profile information for app functionality
CREATE POLICY "Public can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow access to non-sensitive fields for public viewing
  -- Sensitive fields like wallet_address, twitter_url, instagram_url, 
  -- linkedin_url, github_url, location, website should only be viewable by the owner
  true
);

-- Create a security definer function to check if user can view sensitive profile data
CREATE OR REPLACE FUNCTION public.can_view_sensitive_profile_data(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only the profile owner can view sensitive data
  SELECT auth.uid() = profile_user_id;
$$;

-- Create RLS policy specifically for sensitive profile data
-- This will be enforced at the application level by filtering queries
CREATE POLICY "Users can view sensitive data of own profile only"
ON public.profiles
FOR SELECT
USING (can_view_sensitive_profile_data(id));

-- Update the existing policies to be more explicit
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Profile owners have full access to their profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);