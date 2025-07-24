-- Deshabilitar completamente RLS en la tabla profiles para evitar problemas de sesión
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;