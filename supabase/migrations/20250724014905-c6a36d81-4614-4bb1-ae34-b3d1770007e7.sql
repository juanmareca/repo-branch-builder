-- Crear política temporal para acceso público durante la migración
-- Esto permitirá ver los usuarios sin sesión Auth activa

DROP POLICY IF EXISTS "public_access_profiles_temp" ON public.profiles;

CREATE POLICY "public_access_profiles_temp" 
ON public.profiles 
FOR ALL
USING (true)
WITH CHECK (true);

-- Comentario: Esta es una política temporal para facilitar la migración
-- Se debe eliminar una vez completada la migración a Supabase Auth