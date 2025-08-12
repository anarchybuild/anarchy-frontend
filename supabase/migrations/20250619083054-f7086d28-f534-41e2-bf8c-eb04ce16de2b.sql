
-- Add wallet_address column to profiles table to support wallet-based authentication
ALTER TABLE public.profiles ADD COLUMN wallet_address TEXT;

-- Create index for wallet_address lookups
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);

-- Add constraint to ensure either id OR wallet_address is present (but not necessarily both)
-- This allows for both traditional auth users and wallet-only users
