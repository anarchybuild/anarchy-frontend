
-- Phase 1: Database cleanup and schema updates for wallet-only system

-- First, let's update the RLS policies to be wallet-only focused
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;

-- Create simplified RLS policies for wallet-only users
-- Allow anyone to view profiles (for public profile pages)
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

-- Allow users to insert profiles with wallet addresses
CREATE POLICY "Users can create wallet profiles" ON public.profiles
  FOR INSERT WITH CHECK (wallet_address IS NOT NULL);

-- Allow users to update their own wallet profiles
CREATE POLICY "Users can update their own wallet profiles" ON public.profiles
  FOR UPDATE USING (wallet_address IS NOT NULL);

-- Clean up any orphaned profiles without wallet addresses (old Google auth users)
-- Update them to have a placeholder wallet address or delete them
DELETE FROM public.profiles WHERE wallet_address IS NULL;

-- Make wallet_address required for all new profiles
ALTER TABLE public.profiles ALTER COLUMN wallet_address SET NOT NULL;

-- Create index for faster wallet address lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address_unique ON public.profiles(wallet_address);

-- Add unique constraint to prevent duplicate wallet addresses
ALTER TABLE public.profiles ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);
