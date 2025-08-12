-- Create follows table for user follow relationships
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create policies for follows table
CREATE POLICY "Anyone can view follows" 
ON public.follows 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create follows" 
ON public.follows 
FOR INSERT 
WITH CHECK (
  (auth.uid() = follower_id) OR 
  (follower_id IN (SELECT id FROM profiles WHERE wallet_address IS NOT NULL))
);

CREATE POLICY "Users can delete their own follows" 
ON public.follows 
FOR DELETE 
USING (
  (auth.uid() = follower_id) OR 
  (follower_id IN (SELECT id FROM profiles WHERE wallet_address IS NOT NULL))
);

-- Create indexes for better performance
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);