
-- Update RLS policies for profiles table to allow wallet users to manage their profiles

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;

-- Create policies that work for both authenticated users and wallet users
CREATE POLICY "Users can view their own profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    wallet_address IS NOT NULL
  );

CREATE POLICY "Users can insert their own profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    wallet_address IS NOT NULL
  );

CREATE POLICY "Users can update their own profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    (wallet_address IS NOT NULL AND auth.uid() IS NULL)
  );
