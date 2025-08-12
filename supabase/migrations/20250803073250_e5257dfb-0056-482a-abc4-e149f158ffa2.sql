-- Add indexes for better performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_designs_created_at ON public.designs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_private_created_at ON public.designs (private, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_user_id_created_at ON public.designs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_design_id ON public.likes (design_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_design_id ON public.collection_items (design_id);
CREATE INDEX IF NOT EXISTS idx_series_images_series_id ON public.series_images (series_id, order_index);