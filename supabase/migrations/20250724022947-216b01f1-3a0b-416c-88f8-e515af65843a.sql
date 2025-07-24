-- Eliminar la restricción de clave foránea que requiere que el id exista en auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- También eliminar cualquier otra restricción similar
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;