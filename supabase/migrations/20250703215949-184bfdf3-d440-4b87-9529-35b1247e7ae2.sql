-- Create likes table for designs and comments
CREATE TABLE public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  design_id uuid NULL,
  comment_id uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure a user can only like each design/comment once
  UNIQUE (user_id, design_id),
  UNIQUE (user_id, comment_id),
  
  -- Ensure exactly one of design_id or comment_id is set
  CHECK ((design_id IS NOT NULL AND comment_id IS NULL) OR (design_id IS NULL AND comment_id IS NOT NULL))
);

-- Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for likes
CREATE POLICY "Anyone can view likes" 
ON public.likes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create likes" 
ON public.likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IN (SELECT id FROM profiles WHERE wallet_address IS NOT NULL));

CREATE POLICY "Users can delete their own likes" 
ON public.likes 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IN (SELECT id FROM profiles WHERE wallet_address IS NOT NULL));

-- Add foreign key constraints
ALTER TABLE public.likes 
ADD CONSTRAINT likes_design_id_fkey 
FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_comment_id_fkey 
FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE;