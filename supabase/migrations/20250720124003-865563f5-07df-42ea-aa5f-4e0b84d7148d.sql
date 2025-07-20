-- Eliminar columnas skill1, skill2 y nivel_ingles de la tabla persons
ALTER TABLE public.persons DROP COLUMN IF EXISTS skill1;
ALTER TABLE public.persons DROP COLUMN IF EXISTS skill2;
ALTER TABLE public.persons DROP COLUMN IF EXISTS nivel_ingles;