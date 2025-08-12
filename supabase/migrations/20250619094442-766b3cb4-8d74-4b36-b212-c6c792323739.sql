
-- First, delete comments that reference non-existent profiles
DELETE FROM public.comments 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Now update the foreign key constraint for comments to reference profiles instead of users
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
