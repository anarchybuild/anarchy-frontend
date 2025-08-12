-- Update design entries for series to have the first series image as image_url
UPDATE public.designs 
SET image_url = (
  SELECT si.image_url 
  FROM public.series_images si 
  WHERE si.series_id = designs.series_id 
    AND si.is_selected = true 
  ORDER BY si.order_index ASC 
  LIMIT 1
)
WHERE series_id IS NOT NULL AND image_url IS NULL;

-- Create a function to update design image_url when series images change
CREATE OR REPLACE FUNCTION public.update_design_image_for_series()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the design entry's image_url when series images are added/updated
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update design with the first image from the series
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
    -- Update design with the next available image or null
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
$$ LANGUAGE plpgsql;

-- Create trigger to update design image when series images change
CREATE TRIGGER update_design_image_on_series_image_change
  AFTER INSERT OR UPDATE OR DELETE ON public.series_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_design_image_for_series();