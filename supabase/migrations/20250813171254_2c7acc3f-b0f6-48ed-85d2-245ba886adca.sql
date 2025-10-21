-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-images', 
  'generated-images', 
  true, 
  52428800, -- 50MB limit
  '{"image/png","image/jpeg","image/webp"}'
);

-- Create RLS policies for generated images bucket
CREATE POLICY "Anyone can view generated images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-images');

CREATE POLICY "Authenticated users can upload generated images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'generated-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own generated images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'generated-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own generated images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'generated-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);