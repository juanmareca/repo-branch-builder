-- Desactivar temporalmente las políticas RLS que están causando problemas durante la carga masiva
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins pueden insertar perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins pueden actualizar perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins pueden eliminar perfiles" ON public.profiles;

-- Mantener solo la política temporal que permite todo
-- CREATE POLICY "public_access_profiles_temp" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
-- Ya existe esta política