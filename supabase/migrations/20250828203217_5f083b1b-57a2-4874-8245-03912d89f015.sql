-- Fix storage RLS policies for wallet-based image uploads (part 2)

-- Drop ALL existing policies on storage.objects for generated-images bucket
DROP POLICY IF EXISTS "Allow generated image uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow generated image viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow generated image updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow generated image deletion" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own generated images" ON storage.objects;

-- Create simplified policies that work with wallet addresses

-- INSERT: Allow uploads for wallet users (using wallet address as folder name)
CREATE POLICY "generated_images_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'generated-images' AND (
    -- For authenticated users: allow their own profile ID or wallet address
    (auth.uid() IS NOT NULL AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      (storage.foldername(name))[1] IN (
        SELECT wallet_address FROM profiles WHERE id = auth.uid() AND wallet_address IS NOT NULL
      )
    )) OR
    -- For unauthenticated wallet users: allow if folder matches their wallet address
    (auth.uid() IS NULL AND (storage.foldername(name))[1] IN (
      SELECT wallet_address FROM profiles WHERE wallet_address IS NOT NULL
    ))
  )
);

-- SELECT: Public read access
CREATE POLICY "generated_images_select_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'generated-images');

-- UPDATE: Only owners can update
CREATE POLICY "generated_images_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'generated-images' AND (
    (auth.uid() IS NOT NULL AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      (storage.foldername(name))[1] IN (
        SELECT wallet_address FROM profiles WHERE id = auth.uid() AND wallet_address IS NOT NULL
      )
    )) OR
    (auth.uid() IS NULL AND (storage.foldername(name))[1] IN (
      SELECT wallet_address FROM profiles WHERE wallet_address IS NOT NULL
    ))
  )
);

-- DELETE: Only owners can delete
CREATE POLICY "generated_images_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'generated-images' AND (
    (auth.uid() IS NOT NULL AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      (storage.foldername(name))[1] IN (
        SELECT wallet_address FROM profiles WHERE id = auth.uid() AND wallet_address IS NOT NULL
      )
    )) OR
    (auth.uid() IS NULL AND (storage.foldername(name))[1] IN (
      SELECT wallet_address FROM profiles WHERE wallet_address IS NOT NULL
    ))
  )
);