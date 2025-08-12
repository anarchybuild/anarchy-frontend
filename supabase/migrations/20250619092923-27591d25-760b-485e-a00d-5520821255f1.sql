
-- Drop existing policies more carefully, checking if they exist first
DO $$ 
BEGIN
    -- Drop existing profile policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Anyone can view profiles') THEN
        DROP POLICY "Anyone can view profiles" ON public.profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can create profiles') THEN
        DROP POLICY "Users can create profiles" ON public.profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profiles') THEN
        DROP POLICY "Users can update their own profiles" ON public.profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can delete their own profiles') THEN
        DROP POLICY "Users can delete their own profiles" ON public.profiles;
    END IF;

    -- Drop existing comment policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Anyone can view comments') THEN
        DROP POLICY "Anyone can view comments" ON public.comments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can create comments') THEN
        DROP POLICY "Users can create comments" ON public.comments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can update their own comments') THEN
        DROP POLICY "Users can update their own comments" ON public.comments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can delete their own comments') THEN
        DROP POLICY "Users can delete their own comments" ON public.comments;
    END IF;
END $$;

-- Create new RLS policies for profiles table
-- Allow anyone to view profiles (needed for comment author lookups)
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

-- Allow users to insert profiles (for wallet profile creation)
CREATE POLICY "Users can create profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own profiles (both auth and wallet users)
CREATE POLICY "Users can update their own profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    (auth.uid() IS NULL AND wallet_address IS NOT NULL)
  );

-- Allow users to delete their own profiles
CREATE POLICY "Users can delete their own profiles" ON public.profiles
  FOR DELETE USING (
    auth.uid() = id OR 
    (auth.uid() IS NULL AND wallet_address IS NOT NULL)
  );

-- Create new RLS policies for comments table
-- Allow anyone to view comments
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);

-- Allow users to create comments (both auth and wallet users)
CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (
    -- Either the user is authenticated and user_id matches auth.uid()
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Or the user_id exists in profiles table (for wallet users)
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = user_id
    ))
  );

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (
    -- Either the user is authenticated and owns the comment
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Or the comment belongs to a wallet user (check via profiles)
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = user_id
    ))
  );

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (
    -- Either the user is authenticated and owns the comment
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Or the comment belongs to a wallet user (check via profiles)
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = user_id
    ))
  );

-- Ensure RLS is enabled on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
