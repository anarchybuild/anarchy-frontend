-- First, check and clean up orphaned user_ids in designs table
-- Delete designs that reference non-existent profiles
DELETE FROM public.designs 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Now we can safely add the foreign key constraint
ALTER TABLE public.designs 
ADD CONSTRAINT fk_designs_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_designs_user_id ON public.designs(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);