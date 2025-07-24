-- Insertar usuarios por defecto directamente en profiles
-- Primero insertar admin
INSERT INTO public.profiles (id, email, name, role, employee_code, is_active)
VALUES (
  gen_random_uuid(),
  'admin@empresa.com',
  'Administrador',
  'admin'::app_role,
  'ADMIN001',
  true
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  employee_code = EXCLUDED.employee_code;

-- Insertar operaciones
INSERT INTO public.profiles (id, email, name, role, employee_code, is_active)
VALUES (
  gen_random_uuid(),
  'operaciones@empresa.com',
  'Operaciones',
  'operations'::app_role,
  'OPR001',
  true
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  employee_code = EXCLUDED.employee_code;

-- Insertar todos los squad leads
INSERT INTO public.profiles (id, email, name, role, employee_code, is_active) VALUES
(gen_random_uuid(), '4000063@empresa.com', 'ALVAREZ DOMINGUEZ, JORGE', 'squad_lead'::app_role, '4000063', true),
(gen_random_uuid(), '4000146@empresa.com', 'BAUTISTA MIRA, JOAQUIN', 'squad_lead'::app_role, '4000146', true),
(gen_random_uuid(), '4002847@empresa.com', 'CABRERA GALERA, ALEJANDRO', 'squad_lead'::app_role, '4002847', true),
(gen_random_uuid(), '4000068@empresa.com', 'CAMPOS APARICIO, FRANCISCO JAVIER', 'squad_lead'::app_role, '4000068', true),
(gen_random_uuid(), '4001869@empresa.com', 'CAUSSE ALEMAN, MARC', 'squad_lead'::app_role, '4001869', true),
(gen_random_uuid(), '4000069@empresa.com', 'CORTES SANTIESTEBAN, ALEJANDRO', 'squad_lead'::app_role, '4000069', true),
(gen_random_uuid(), '4000074@empresa.com', 'DELGADO LOPEZ, ALBERTO', 'squad_lead'::app_role, '4000074', true),
(gen_random_uuid(), '4000077@empresa.com', 'DIAZ GARCES, CARLOS', 'squad_lead'::app_role, '4000077', true),
(gen_random_uuid(), '4000081@empresa.com', 'DONATE NAVARRO, CARLOS', 'squad_lead'::app_role, '4000081', true),
(gen_random_uuid(), '4001837@empresa.com', 'ESTEVE PASTOR, MIGUEL ANGEL', 'squad_lead'::app_role, '4001837', true),
(gen_random_uuid(), '4000086@empresa.com', 'FERNANDEZ CRUZ, CARLOS', 'squad_lead'::app_role, '4000086', true),
(gen_random_uuid(), '4000088@empresa.com', 'GARCIA SANCHEZ, FRANCISCO JOSE', 'squad_lead'::app_role, '4000088', true),
(gen_random_uuid(), '4002845@empresa.com', 'GOMEZ CANO, MIGUEL ANGEL', 'squad_lead'::app_role, '4002845', true),
(gen_random_uuid(), '4001523@empresa.com', 'HERRERA CARRERA, JOSE MIGUEL', 'squad_lead'::app_role, '4001523', true),
(gen_random_uuid(), '4001243@empresa.com', 'JIMENEZ GALLEGO, PABLO', 'squad_lead'::app_role, '4001243', true),
(gen_random_uuid(), '4002731@empresa.com', 'LOPEZ AVILA, AITOR', 'squad_lead'::app_role, '4002731', true),
(gen_random_uuid(), '4000100@empresa.com', 'LOPEZ MARTINEZ, FRANCISCO', 'squad_lead'::app_role, '4000100', true),
(gen_random_uuid(), '4003057@empresa.com', 'LOPEZ RUEDA, MIGUEL ANGEL', 'squad_lead'::app_role, '4003057', true),
(gen_random_uuid(), '4001247@empresa.com', 'MARCO CANADAS, CARLOS', 'squad_lead'::app_role, '4001247', true),
(gen_random_uuid(), '4000316@empresa.com', 'MARCUS CRISAN, IONUT ALEXANDRU', 'squad_lead'::app_role, '4000316', true),
(gen_random_uuid(), '4001245@empresa.com', 'MARTINEZ DE SORIA RUEDA, ANDER', 'squad_lead'::app_role, '4001245', true),
(gen_random_uuid(), '4000465@empresa.com', 'MARTINEZ MARTIN, FRANCISCO', 'squad_lead'::app_role, '4000465', true),
(gen_random_uuid(), '4001251@empresa.com', 'MELERO MILLAN, IVAN', 'squad_lead'::app_role, '4001251', true),
(gen_random_uuid(), '4001833@empresa.com', 'MIGUEL NIEVA, EDUARDO', 'squad_lead'::app_role, '4001833', true),
(gen_random_uuid(), '4000089@empresa.com', 'ORTEGA CUEVAS, ANGEL LUIS', 'squad_lead'::app_role, '4000089', true),
(gen_random_uuid(), '4000112@empresa.com', 'ORTEGA MUNTANE, LUIS JAVIER', 'squad_lead'::app_role, '4000112', true),
(gen_random_uuid(), '4000090@empresa.com', 'PORTEIRO EIROA, EZEQUIEL', 'squad_lead'::app_role, '4000090', true),
(gen_random_uuid(), '4002133@empresa.com', 'RABAGO TORRE, VALENTIN', 'squad_lead'::app_role, '4002133', true),
(gen_random_uuid(), '4002729@empresa.com', 'REVILLA MAILLO, JUAN MANUEL', 'squad_lead'::app_role, '4002729', true),
(gen_random_uuid(), '4001527@empresa.com', 'RODRIGUEZ FERNANDEZ, BELEN', 'squad_lead'::app_role, '4001527', true),
(gen_random_uuid(), '4000147@empresa.com', 'ROLDAN COSANO, EMILIO', 'squad_lead'::app_role, '4000147', true),
(gen_random_uuid(), '4000535@empresa.com', 'ROMERO SALINAS, ESTEFANIA', 'squad_lead'::app_role, '4000535', true),
(gen_random_uuid(), '4003058@empresa.com', 'ROQUE DIAZ, MANUEL', 'squad_lead'::app_role, '4003058', true),
(gen_random_uuid(), '4001949@empresa.com', 'SOLAZ TORRES, LUIS', 'squad_lead'::app_role, '4001949', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  employee_code = EXCLUDED.employee_code;