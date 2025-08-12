
-- First, let's ensure RLS is enabled
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Anyone can view designs" ON public.designs;
DROP POLICY IF EXISTS "Users can create designs" ON public.designs;
DROP POLICY IF EXISTS "Users can update their own designs" ON public.designs;
DROP POLICY IF EXISTS "Users can delete their own designs" ON public.designs;

-- Allow anyone to view all designs (public marketplace)
CREATE POLICY "Anyone can view designs" ON public.designs
  FOR SELECT USING (true);

-- Allow authenticated users to create designs (both Supabase auth and wallet users)
CREATE POLICY "Users can create designs" ON public.designs
  FOR INSERT WITH CHECK (user_id IS NOT NULL);

-- Allow users to update their own designs
CREATE POLICY "Users can update their own designs" ON public.designs
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT id FROM public.profiles WHERE wallet_address IS NOT NULL)
  );

-- Allow users to delete their own designs
CREATE POLICY "Users can delete their own designs" ON public.designs
  FOR DELETE USING (
    user_id = auth.uid() OR 
    user_id IN (SELECT id FROM public.profiles WHERE wallet_address IS NOT NULL)
  );
