-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'reply', 'follow')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- References to related entities
  from_user_id UUID NOT NULL,
  design_id UUID,
  comment_id UUID,
  
  -- Indexes for performance
  UNIQUE(user_id, type, from_user_id, design_id, comment_id)
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (user_id IN (SELECT id FROM profiles WHERE wallet_address IS NOT NULL))
);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (user_id IN (SELECT id FROM profiles WHERE wallet_address IS NOT NULL))
);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (user_id IN (SELECT id FROM profiles WHERE wallet_address IS NOT NULL))
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;