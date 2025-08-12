-- Update RLS policy for likes table to handle both Supabase auth and wallet users
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;

CREATE POLICY "Users can create likes" 
ON public.likes 
FOR INSERT 
WITH CHECK (
  -- For Supabase authenticated users
  (auth.uid() = user_id) 
  OR 
  -- For wallet users: allow if user_id exists in profiles table
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id
  ))
);

-- Also update one of the duplicate comments policies
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;

CREATE POLICY "Users can create comments updated" 
ON public.comments 
FOR INSERT 
WITH CHECK (
  -- For Supabase authenticated users
  (auth.uid() = user_id) 
  OR 
  -- For wallet users: allow if user_id exists in profiles table
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id
  ))
);