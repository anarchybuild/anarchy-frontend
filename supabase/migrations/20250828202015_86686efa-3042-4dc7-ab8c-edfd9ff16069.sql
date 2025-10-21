-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.public_profile_view;

-- Ensure the profiles table has proper RLS policies for public access
-- The existing policies should already handle this, but let's verify they work correctly

-- Create a safe function to get public profile data if needed
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_username text)
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  description text,
  location text,
  website text,
  twitter_url text,
  instagram_url text,
  linkedin_url text,
  github_url text,
  created_at timestamp with time zone
) LANGUAGE sql STABLE AS $$
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.description,
    p.location,
    p.website,
    p.twitter_url,
    p.instagram_url,
    p.linkedin_url,
    p.github_url,
    p.created_at
  FROM profiles p
  WHERE p.username = profile_username;
$$;