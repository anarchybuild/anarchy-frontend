-- Fix database functions security by adding proper search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
begin
  insert into public.profiles (id, username, name, avatar_url, username_set)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'email', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    false
  );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_design_for_series()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.designs (id, user_id, name, description, series_id, created_at, updated_at, private)
  VALUES (
    NEW.id,
    NEW.user_id,
    NEW.name,
    NEW.description,
    NEW.id,
    NEW.created_at,
    NEW.updated_at,
    NOT NEW.is_published
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_design_with_series()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.designs 
  SET 
    name = NEW.name,
    description = NEW.description,
    updated_at = NEW.updated_at,
    private = NOT NEW.is_published
  WHERE id = NEW.id OR series_id = NEW.id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_design_image_for_series()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.designs 
    SET image_url = (
      SELECT si.image_url 
      FROM public.series_images si 
      WHERE si.series_id = NEW.series_id 
        AND si.is_selected = true 
      ORDER BY si.order_index ASC 
      LIMIT 1
    )
    WHERE series_id = NEW.series_id;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.designs 
    SET image_url = (
      SELECT si.image_url 
      FROM public.series_images si 
      WHERE si.series_id = OLD.series_id 
        AND si.is_selected = true 
      ORDER BY si.order_index ASC 
      LIMIT 1
    )
    WHERE series_id = OLD.series_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Fix RLS policies to remove overly permissive wallet-based access
-- Update likes policies
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;

CREATE POLICY "Authenticated users can create likes" 
ON public.likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update comments policies
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;

CREATE POLICY "Users can create comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Update follows policies
DROP POLICY IF EXISTS "Authenticated users can create follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;

CREATE POLICY "Authenticated users can create follows" 
ON public.follows 
FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" 
ON public.follows 
FOR DELETE 
USING (auth.uid() = follower_id);

-- Update collections policies
DROP POLICY IF EXISTS "Users can create their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can delete their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can update their own collections" ON public.collections;

CREATE POLICY "Users can create their own collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" 
ON public.collections 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" 
ON public.collections 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Update collection_items policies
DROP POLICY IF EXISTS "Collection owners can add items" ON public.collection_items;
DROP POLICY IF EXISTS "Collection owners can remove items" ON public.collection_items;

CREATE POLICY "Collection owners can add items" 
ON public.collection_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM collections 
  WHERE collections.id = collection_items.collection_id 
  AND auth.uid() = collections.user_id
));

CREATE POLICY "Collection owners can remove items" 
ON public.collection_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM collections 
  WHERE collections.id = collection_items.collection_id 
  AND auth.uid() = collections.user_id
));

-- Update designs policies
DROP POLICY IF EXISTS "Users can delete their own designs" ON public.designs;
DROP POLICY IF EXISTS "Users can update their own designs" ON public.designs;

CREATE POLICY "Users can delete their own designs" 
ON public.designs 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs" 
ON public.designs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Update series policies
DROP POLICY IF EXISTS "Users can create their own series" ON public.series;
DROP POLICY IF EXISTS "Users can delete their own series" ON public.series;
DROP POLICY IF EXISTS "Users can update their own series" ON public.series;
DROP POLICY IF EXISTS "Anyone can view published series" ON public.series;

CREATE POLICY "Users can create their own series" 
ON public.series 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own series" 
ON public.series 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own series" 
ON public.series 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published series" 
ON public.series 
FOR SELECT 
USING ((is_published = true) OR (auth.uid() = user_id));

-- Update series_images policies
DROP POLICY IF EXISTS "Series owners can manage images" ON public.series_images;

CREATE POLICY "Series owners can manage images" 
ON public.series_images 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM series 
  WHERE series.id = series_images.series_id 
  AND auth.uid() = series.user_id
));

-- Update notifications policies
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update profiles policies to be more restrictive
DROP POLICY IF EXISTS "Users can delete their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own wallet profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create wallet profiles" ON public.profiles;

CREATE POLICY "Users can delete their own profiles" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profiles" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Create a secure function to validate user ownership
CREATE OR REPLACE FUNCTION public.is_profile_owner(profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT auth.uid() = profile_id;
$$;

-- Add input validation function for user content
CREATE OR REPLACE FUNCTION public.sanitize_html_content(content text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
STRICT
SET search_path = 'public'
AS $$
BEGIN
  -- Basic HTML sanitization - remove script tags and other dangerous elements
  content := regexp_replace(content, '<script[^>]*>.*?</script>', '', 'gi');
  content := regexp_replace(content, '<iframe[^>]*>.*?</iframe>', '', 'gi');
  content := regexp_replace(content, '<object[^>]*>.*?</object>', '', 'gi');
  content := regexp_replace(content, '<embed[^>]*>', '', 'gi');
  content := regexp_replace(content, '<link[^>]*>', '', 'gi');
  content := regexp_replace(content, '<meta[^>]*>', '', 'gi');
  content := regexp_replace(content, 'javascript:', '', 'gi');
  content := regexp_replace(content, 'vbscript:', '', 'gi');
  content := regexp_replace(content, 'onload=', '', 'gi');
  content := regexp_replace(content, 'onerror=', '', 'gi');
  content := regexp_replace(content, 'onclick=', '', 'gi');
  
  RETURN content;
END;
$$;