-- Add private column to designs table
ALTER TABLE public.designs 
ADD COLUMN private boolean NOT NULL DEFAULT false;