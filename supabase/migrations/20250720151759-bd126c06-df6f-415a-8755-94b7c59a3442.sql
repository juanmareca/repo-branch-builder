-- Añadir el campo origen a la tabla projects si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'origen'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN origen text NOT NULL DEFAULT 'Fichero';
    END IF;
END $$;

-- Asegurar que todos los registros existentes tengan el origen como 'Fichero'
UPDATE public.projects 
SET origen = 'Fichero' 
WHERE origen IS NULL OR origen = '';

-- Crear función para actualizar origen cuando se modifica un registro
CREATE OR REPLACE FUNCTION public.update_project_origen()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el registro se está actualizando, marcar origen como 'Administrador'
  IF TG_OP = 'UPDATE' THEN
    NEW.origen = 'Administrador';
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar automáticamente el origen
DROP TRIGGER IF EXISTS trigger_update_project_origen ON public.projects;
CREATE TRIGGER trigger_update_project_origen
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_origen();