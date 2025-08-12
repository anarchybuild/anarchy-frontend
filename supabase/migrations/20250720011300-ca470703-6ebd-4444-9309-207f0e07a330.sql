-- Fix RLS policies for series table to work with wallet authentication
DROP POLICY IF EXISTS "Users can update their own series" ON public.series;

CREATE POLICY "Users can update their own series" ON public.series
  FOR UPDATE USING (
    -- For authenticated Supabase users
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- For wallet users (no Supabase auth), allow if user_id exists in profiles with wallet_address
    (auth.uid() IS NULL AND user_id IN (
      SELECT id FROM public.profiles WHERE wallet_address IS NOT NULL
    ))
  );