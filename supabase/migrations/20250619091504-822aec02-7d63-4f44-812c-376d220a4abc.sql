
-- Remove the foreign key constraint that references auth.users
ALTER TABLE public.designs DROP CONSTRAINT IF EXISTS designs_user_id_fkey;

-- The user_id column will now just be a UUID that references profiles.id
-- No need to add a new foreign key constraint since we handle this in the application layer
