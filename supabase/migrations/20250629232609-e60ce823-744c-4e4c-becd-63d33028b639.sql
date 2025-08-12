
-- Add social media URL columns to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN twitter_url text,
ADD COLUMN instagram_url text,
ADD COLUMN linkedin_url text,
ADD COLUMN github_url text;
