-- Create design entries for existing series so they can be liked, commented on, and saved
INSERT INTO public.designs (id, user_id, name, description, series_id, created_at, updated_at, private)
SELECT 
  s.id,
  s.user_id,
  s.name,
  s.description,
  s.id as series_id,
  s.created_at,
  s.updated_at,
  NOT s.is_published as private
FROM public.series s
WHERE NOT EXISTS (
  SELECT 1 FROM public.designs d WHERE d.id = s.id OR d.series_id = s.id
);

-- Create a function to automatically create design entries when series are created
CREATE OR REPLACE FUNCTION public.create_design_for_series()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a corresponding design entry for the new series
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
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically create design entries for new series
CREATE TRIGGER create_design_for_new_series
  AFTER INSERT ON public.series
  FOR EACH ROW
  EXECUTE FUNCTION public.create_design_for_series();

-- Create a function to keep design entries in sync when series are updated
CREATE OR REPLACE FUNCTION public.sync_design_with_series()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the corresponding design entry
  UPDATE public.designs 
  SET 
    name = NEW.name,
    description = NEW.description,
    updated_at = NEW.updated_at,
    private = NOT NEW.is_published
  WHERE id = NEW.id OR series_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to keep design entries in sync when series are updated
CREATE TRIGGER sync_design_on_series_update
  AFTER UPDATE ON public.series
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_design_with_series();