-- Create missing foreign key relationship between designs and profiles
-- This will fix the join query that's currently failing

-- First, let's ensure we have the proper foreign key relationship
ALTER TABLE public.designs 
ADD CONSTRAINT fk_designs_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create an index for better join performance
CREATE INDEX IF NOT EXISTS idx_designs_user_id ON public.designs(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Update any existing designs that might have orphaned user_ids
-- This ensures data integrity before the foreign key constraint
UPDATE public.designs 
SET user_id = (
  SELECT id FROM public.profiles WHERE profiles.id = designs.user_id LIMIT 1
)
WHERE user_id NOT IN (SELECT id FROM public.profiles);