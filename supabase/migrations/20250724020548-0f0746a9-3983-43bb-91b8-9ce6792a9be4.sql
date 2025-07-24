-- Limpiar usuarios existentes
DELETE FROM public.profiles;

-- Insertar solo usuarios básicos por defecto
INSERT INTO public.profiles (id, email, name, role, is_active)
VALUES 
  (gen_random_uuid(), 'admin@system.com', 'Administrador', 'admin', true),
  (gen_random_uuid(), 'operaciones@system.com', 'Operaciones', 'operations', true);