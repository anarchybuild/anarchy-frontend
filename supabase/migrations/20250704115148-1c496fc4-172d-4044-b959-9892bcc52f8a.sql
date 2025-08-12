-- Create collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection_items table (junction table for designs in collections)
CREATE TABLE public.collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, design_id)
);

-- Enable Row Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Users can view all collections" 
ON public.collections 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.wallet_address IS NOT NULL
));

CREATE POLICY "Users can update their own collections" 
ON public.collections 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.wallet_address IS NOT NULL
));

CREATE POLICY "Users can delete their own collections" 
ON public.collections 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.wallet_address IS NOT NULL
));

-- Collection items policies
CREATE POLICY "Anyone can view collection items" 
ON public.collection_items 
FOR SELECT 
USING (true);

CREATE POLICY "Collection owners can add items" 
ON public.collection_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.collections 
  WHERE id = collection_id 
  AND (auth.uid() = user_id OR user_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.wallet_address IS NOT NULL
  ))
));

CREATE POLICY "Collection owners can remove items" 
ON public.collection_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.collections 
  WHERE id = collection_id 
  AND (auth.uid() = user_id OR user_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.wallet_address IS NOT NULL
  ))
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_collection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_collection_updated_at();