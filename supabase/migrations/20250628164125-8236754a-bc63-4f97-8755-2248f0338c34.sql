
-- Drop existing RLS policies that depend on auth.uid()
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;

-- Create new RLS policies for wallet-based authentication
-- Allow public read access for viewing profile pictures
CREATE POLICY "Public read access for profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profilepicture');

-- Allow unrestricted upload access (app handles wallet verification)
CREATE POLICY "Allow profile picture uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profilepicture');

-- Allow unrestricted update access (app handles wallet verification)
CREATE POLICY "Allow profile picture updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profilepicture');

-- Allow unrestricted delete access (app handles wallet verification)
CREATE POLICY "Allow profile picture deletions"
ON storage.objects FOR DELETE
USING (bucket_id = 'profilepicture');
