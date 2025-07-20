-- Verificar y actualizar la tabla projects para que tenga todos los campos del Excel
-- La tabla ya existe, solo vamos a asegurar que tenga todos los campos necesarios

-- Verificar que existan todos los campos requeridos
-- Si alguno no existe, lo agregamos

DO $$
BEGIN
    -- Verificar si existe la columna descripcion para el campo "Descripción" del Excel
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'descripcion') THEN
        ALTER TABLE public.projects ADD COLUMN descripcion text DEFAULT '';
    END IF;
END $$;