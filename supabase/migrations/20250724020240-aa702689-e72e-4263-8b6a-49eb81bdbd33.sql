-- Eliminar todos los usuarios existentes excepto admin
DELETE FROM auth.users WHERE email NOT IN ('admin@system.com');

-- Insertar solo usuarios básicos por defecto
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, is_super_admin, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'admin@system.com', crypt('admin123', gen_salt('bf')), now(), now(), now(), '{"name": "Administrador"}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'operaciones@system.com', crypt('Oper123', gen_salt('bf')), now(), now(), now(), '{"name": "Operaciones"}', false, 'authenticated')
ON CONFLICT (email) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  updated_at = now(),
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Insertar perfiles correspondientes
INSERT INTO public.profiles (id, email, name, role, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@system.com', 'Administrador', 'admin', true),
  ('00000000-0000-0000-0000-000000000002', 'operaciones@system.com', 'Operaciones', 'operations', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();