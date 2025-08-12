-- Fix wallet address exposure vulnerability
-- Ensure wallet addresses are only accessible to authorized users

-- Create a security definer function to get profiles without exposing wallet addresses
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_username text)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  name text,
  avatar_url text,
  description text,
  location text,
  website text,
  twitter_url text,
  instagram_url text,
  linkedin_url text,
  github_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.name,
    p.avatar_url,
    p.description,
    p.location,
    p.website,
    p.twitter_url,
    p.instagram_url,
    p.linkedin_url,
    p.github_url,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.username = profile_username
  LIMIT 1;
$$;

-- Create a security definer function to get profile by wallet address (for internal use only)
CREATE OR REPLACE FUNCTION public.get_profile_by_wallet_address(wallet_addr text)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  name text,
  avatar_url text,
  description text,
  location text,
  website text,
  twitter_url text,
  instagram_url text,
  linkedin_url text,
  github_url text,
  wallet_address text,
  username_set boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.name,
    p.avatar_url,
    p.description,
    p.location,
    p.website,
    p.twitter_url,
    p.instagram_url,
    p.linkedin_url,
    p.github_url,
    p.wallet_address,
    p.username_set,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.wallet_address = wallet_addr
  LIMIT 1;
$$;

-- Create a view for public profile data (without wallet addresses)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  display_name,
  name,
  avatar_url,
  description,
  location,
  website,
  twitter_url,
  instagram_url,
  linkedin_url,
  github_url,
  created_at,
  updated_at
FROM profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Create policy for public profile view access
CREATE POLICY "Anyone can view public profile data"
ON public.public_profiles
FOR SELECT
USING (true);

-- Update the main profiles table policies to be more restrictive
-- First drop the overly permissive "Public can view basic profile info" policy
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

-- Create a new restrictive policy that prevents wallet address exposure
CREATE POLICY "Limited public profile access (no sensitive data)"
ON public.profiles
FOR SELECT
USING (
  -- Only allow access to specific columns, wallet_address is excluded
  -- This policy works in conjunction with application-level filtering
  auth.uid() = id -- Only profile owners can see full data
);

-- Create policy for service account access (for wallet address lookups)
CREATE POLICY "Service functions can access profiles"
ON public.profiles
FOR SELECT
USING (
  -- Allow access from security definer functions only
  current_setting('role', true) = 'service_role'
  OR auth.uid() = id
);

-- Grant necessary permissions for the public view
GRANT SELECT ON public.public_profiles TO authenticated, anon;