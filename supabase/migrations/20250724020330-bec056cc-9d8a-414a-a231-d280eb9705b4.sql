-- Limpiar usuarios existentes primero
DELETE FROM public.profiles WHERE email NOT IN ('admin@system.com');

-- Insertar perfiles básicos por defecto
INSERT INTO public.profiles (id, email, name, role, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@system.com', 'Administrador', 'admin', true),
  ('00000000-0000-0000-0000-000000000002', 'operaciones@system.com', 'Operaciones', 'operations', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();