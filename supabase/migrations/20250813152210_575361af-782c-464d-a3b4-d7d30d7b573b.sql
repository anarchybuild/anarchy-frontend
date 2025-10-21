-- Add thumbnail and medium image URL columns to designs table
ALTER TABLE public.designs 
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN medium_url TEXT;