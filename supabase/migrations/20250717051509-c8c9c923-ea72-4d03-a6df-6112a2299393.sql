-- Test the current collections RLS policies by trying to fetch collections as an unauthenticated user
-- This will help us understand if the RLS policies are blocking wallet users

-- Update RLS policies for collections to be more explicit about wallet users
DROP POLICY IF EXISTS "Users can view all collections" ON public.collections;

CREATE POLICY "Users can view all collections" 
ON public.collections 
FOR SELECT 
USING (true);

-- Also update the collection_items policy to be more permissive for viewing
DROP POLICY IF EXISTS "Anyone can view collection items" ON public.collection_items;

CREATE POLICY "Anyone can view collection items" 
ON public.collection_items 
FOR SELECT 
USING (true);