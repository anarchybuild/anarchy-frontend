
-- Remove the foreign key constraint that references auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make the id column use a default UUID generator since we're not linking to auth.users anymore
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
