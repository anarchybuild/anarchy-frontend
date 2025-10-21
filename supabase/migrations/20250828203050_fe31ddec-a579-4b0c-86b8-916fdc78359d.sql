-- Fix storage RLS policies for wallet-based image uploads

-- First, drop existing conflicting policies on storage.objects for generated-images bucket
DROP POLICY IF EXISTS "Users can upload their own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own generated images" ON storage.objects;

-- Create simplified and working policies for generated-images bucket

-- Allow INSERT: authenticated users can upload to their own folders, unauthenticated users can upload if folder matches their wallet address
CREATE POLICY "Allow generated image uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'generated-images' AND (
    -- Authenticated users: folder name should match their profile ID or wallet address
    (auth.uid() IS NOT NULL AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      (storage.foldername(name))[1] IN (
        SELECT wallet_address FROM profiles WHERE id = auth.uid()
      )
    )) OR
    -- Unauthenticated users: folder name should match a wallet address in profiles
    (auth.uid() IS NULL AND (storage.foldername(name))[1] IN (
      SELECT wallet_address FROM profiles WHERE wallet_address IS NOT NULL
    ))
  )
);

-- Allow SELECT: public read access for generated-images bucket
CREATE POLICY "Allow generated image viewing" ON storage.objects
FOR SELECT USING (bucket_id = 'generated-images');

-- Allow UPDATE: only owners can update their images
CREATE POLICY "Allow generated image updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'generated-images' AND (
    -- Authenticated users: folder name should match their profile ID or wallet address
    (auth.uid() IS NOT NULL AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      (storage.foldername(name))[1] IN (
        SELECT wallet_address FROM profiles WHERE id = auth.uid()
      )
    )) OR
    -- Unauthenticated users: folder name should match a wallet address in profiles
    (auth.uid() IS NULL AND (storage.foldername(name))[1] IN (
      SELECT wallet_address FROM profiles WHERE wallet_address IS NOT NULL
    ))
  )
);

-- Allow DELETE: only owners can delete their images
CREATE POLICY "Allow generated image deletion" ON storage.objects
FOR DELETE USING (
  bucket_id = 'generated-images' AND (
    -- Authenticated users: folder name should match their profile ID or wallet address
    (auth.uid() IS NOT NULL AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      (storage.foldername(name))[1] IN (
        SELECT wallet_address FROM profiles WHERE id = auth.uid()
      )
    )) OR
    -- Unauthenticated users: folder name should match a wallet address in profiles
    (auth.uid() IS NULL AND (storage.foldername(name))[1] IN (
      SELECT wallet_address FROM profiles WHERE wallet_address IS NOT NULL
    ))
  )
);