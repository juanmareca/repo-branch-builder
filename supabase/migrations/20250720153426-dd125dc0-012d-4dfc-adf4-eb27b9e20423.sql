-- Limpiar tabla projects para mantener solo los campos necesarios
-- Eliminar columnas que no aparecen en la especificación del usuario

-- Primero eliminar las columnas que no son necesarias
ALTER TABLE public.projects DROP COLUMN IF EXISTS start_date;
ALTER TABLE public.projects DROP COLUMN IF EXISTS end_date;
ALTER TABLE public.projects DROP COLUMN IF EXISTS budget;
ALTER TABLE public.projects DROP COLUMN IF EXISTS squad_lead_id;
ALTER TABLE public.projects DROP COLUMN IF EXISTS progress;
ALTER TABLE public.projects DROP COLUMN IF EXISTS codigo_proyecto;
ALTER TABLE public.projects DROP COLUMN IF EXISTS name;
ALTER TABLE public.projects DROP COLUMN IF EXISTS description;
ALTER TABLE public.projects DROP COLUMN IF EXISTS status;
ALTER TABLE public.projects DROP COLUMN IF EXISTS priority;
ALTER TABLE public.projects DROP COLUMN IF EXISTS billing_type;

-- Verificar que tenemos todos los campos necesarios según la imagen:
-- Los campos que deben existir son:
-- - id (sistema)
-- - codigo_inicial ✓
-- - descripcion ✓ 
-- - denominacion ✓
-- - tipologia ✓
-- - tipologia_2 ✓
-- - gestor_proyecto ✓
-- - socio_responsable ✓
-- - cliente ✓
-- - grupo_cliente ✓
-- - origen ✓
-- - created_at (sistema)
-- - updated_at (sistema)