-- Grant necessary permissions on storage tables to fix image upload 401 errors

-- Grant permissions on storage.objects table for image uploads
GRANT SELECT ON storage.objects TO public;
GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON storage.objects TO anon;

-- Grant permissions on storage.buckets table
GRANT SELECT ON storage.buckets TO public;
GRANT SELECT ON storage.buckets TO authenticated;
GRANT SELECT ON storage.buckets TO anon;

-- Ensure the generated-images bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure the avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure the profilepicture bucket exists and is public  
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profilepicture', 'profilepicture', true) 
ON CONFLICT (id) DO UPDATE SET public = true;