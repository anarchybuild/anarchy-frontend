-- Create a security definer function to check if user_id has a valid wallet profile
CREATE OR REPLACE FUNCTION public.is_valid_wallet_user(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = check_user_id 
    AND wallet_address IS NOT NULL
  );
$$;

-- Drop the problematic policy and recreate with the function
DROP POLICY IF EXISTS "Allow series creation for wallet users" ON public.series;

-- Create a new policy using the security definer function
CREATE POLICY "Allow series creation for wallet users"
ON public.series
FOR INSERT
WITH CHECK (
  user_id IS NOT NULL AND 
  public.is_valid_wallet_user(user_id)
);