
-- Add display_name column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN display_name text;

-- Add constraint to limit display_name length and format (up to 15 characters, letters, numbers, underscores only)
ALTER TABLE public.profiles 
ADD CONSTRAINT display_name_format CHECK (
  display_name IS NULL OR 
  (char_length(display_name) <= 15 AND display_name ~ '^[a-zA-Z0-9_]+$')
);
