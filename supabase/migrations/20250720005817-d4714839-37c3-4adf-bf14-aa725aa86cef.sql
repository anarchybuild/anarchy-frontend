-- Create series table
CREATE TABLE public.series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  model TEXT,
  width INTEGER DEFAULT 1024,
  height INTEGER DEFAULT 1024,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create series_images table
CREATE TABLE public.series_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_selected BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add series_id to designs table
ALTER TABLE public.designs ADD COLUMN series_id UUID;

-- Enable RLS on series table
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- Enable RLS on series_images table  
ALTER TABLE public.series_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for series table
CREATE POLICY "Anyone can view published series" ON public.series
  FOR SELECT USING (
    is_published = true OR 
    user_id = auth.uid() OR 
    user_id IN (SELECT id FROM public.profiles WHERE wallet_address IS NOT NULL)
  );

CREATE POLICY "Users can create their own series" ON public.series
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    user_id IN (SELECT id FROM public.profiles WHERE wallet_address IS NOT NULL)
  );

CREATE POLICY "Users can update their own series" ON public.series
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    user_id IN (SELECT id FROM public.profiles WHERE wallet_address IS NOT NULL)
  );

CREATE POLICY "Users can delete their own series" ON public.series
  FOR DELETE USING (
    auth.uid() = user_id OR 
    user_id IN (SELECT id FROM public.profiles WHERE wallet_address IS NOT NULL)
  );

-- RLS policies for series_images table
CREATE POLICY "Anyone can view series images" ON public.series_images
  FOR SELECT USING (true);

CREATE POLICY "Series owners can manage images" ON public.series_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.series 
      WHERE series.id = series_images.series_id 
      AND (
        series.user_id = auth.uid() OR 
        series.user_id IN (SELECT id FROM public.profiles WHERE wallet_address IS NOT NULL)
      )
    )
  );

-- Add trigger for updating series updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_series_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_series_updated_at
  BEFORE UPDATE ON public.series
  FOR EACH ROW
  EXECUTE FUNCTION public.update_series_updated_at();