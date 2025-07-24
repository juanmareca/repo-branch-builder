-- Eliminar la restricción de unicidad del email
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;

-- También eliminar cualquier índice único en email
DROP INDEX IF EXISTS profiles_email_idx;