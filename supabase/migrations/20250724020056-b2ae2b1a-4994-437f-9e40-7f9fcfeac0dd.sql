-- Insertar usuarios por defecto con todos los squad leads

-- Función helper para crear usuarios Auth y perfiles
CREATE OR REPLACE FUNCTION create_default_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role app_role,
  p_employee_code TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Generar un UUID fijo basado en el email para evitar duplicados
  v_user_id := gen_random_uuid();
  
  -- Insertar en profiles (tabla pública)
  INSERT INTO public.profiles (id, email, name, role, employee_code, is_active)
  VALUES (v_user_id, p_email, p_name, p_role, p_employee_code, true)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    employee_code = EXCLUDED.employee_code,
    is_active = EXCLUDED.is_active;
    
  RETURN v_user_id;
END;
$$;

-- Crear usuario administrador
SELECT create_default_user(
  'admin@empresa.com',
  'admin123',
  'Administrador',
  'admin'::app_role,
  'ADMIN001'
);

-- Crear usuario operaciones  
SELECT create_default_user(
  'operaciones@empresa.com',
  'Oper123',
  'Operaciones', 
  'operations'::app_role,
  'OPR001'
);

-- Crear todos los squad leads
SELECT create_default_user('4000063@empresa.com', '4000063', 'ALVAREZ DOMINGUEZ, JORGE', 'squad_lead'::app_role, '4000063');
SELECT create_default_user('4000146@empresa.com', '4000146', 'BAUTISTA MIRA, JOAQUIN', 'squad_lead'::app_role, '4000146');
SELECT create_default_user('4002847@empresa.com', '4002847', 'CABRERA GALERA, ALEJANDRO', 'squad_lead'::app_role, '4002847');
SELECT create_default_user('4000068@empresa.com', '4000068', 'CAMPOS APARICIO, FRANCISCO JAVIER', 'squad_lead'::app_role, '4000068');
SELECT create_default_user('4001869@empresa.com', '4001869', 'CAUSSE ALEMAN, MARC', 'squad_lead'::app_role, '4001869');
SELECT create_default_user('4000069@empresa.com', '4000069', 'CORTES SANTIESTEBAN, ALEJANDRO', 'squad_lead'::app_role, '4000069');
SELECT create_default_user('4000074@empresa.com', '4000074', 'DELGADO LOPEZ, ALBERTO', 'squad_lead'::app_role, '4000074');
SELECT create_default_user('4000077@empresa.com', '4000077', 'DIAZ GARCES, CARLOS', 'squad_lead'::app_role, '4000077');
SELECT create_default_user('4000081@empresa.com', '4000081', 'DONATE NAVARRO, CARLOS', 'squad_lead'::app_role, '4000081');
SELECT create_default_user('4001837@empresa.com', '4001837', 'ESTEVE PASTOR, MIGUEL ANGEL', 'squad_lead'::app_role, '4001837');
SELECT create_default_user('4000086@empresa.com', '4000086', 'FERNANDEZ CRUZ, CARLOS', 'squad_lead'::app_role, '4000086');
SELECT create_default_user('4000088@empresa.com', '4000088', 'GARCIA SANCHEZ, FRANCISCO JOSE', 'squad_lead'::app_role, '4000088');
SELECT create_default_user('4002845@empresa.com', '4002845', 'GOMEZ CANO, MIGUEL ANGEL', 'squad_lead'::app_role, '4002845');
SELECT create_default_user('4001523@empresa.com', '4001523', 'HERRERA CARRERA, JOSE MIGUEL', 'squad_lead'::app_role, '4001523');
SELECT create_default_user('4001243@empresa.com', '4001243', 'JIMENEZ GALLEGO, PABLO', 'squad_lead'::app_role, '4001243');
SELECT create_default_user('4002731@empresa.com', '4002731', 'LOPEZ AVILA, AITOR', 'squad_lead'::app_role, '4002731');
SELECT create_default_user('4000100@empresa.com', '4000100', 'LOPEZ MARTINEZ, FRANCISCO', 'squad_lead'::app_role, '4000100');
SELECT create_default_user('4003057@empresa.com', '4003057', 'LOPEZ RUEDA, MIGUEL ANGEL', 'squad_lead'::app_role, '4003057');
SELECT create_default_user('4001247@empresa.com', '4001247', 'MARCO CANADAS, CARLOS', 'squad_lead'::app_role, '4001247');
SELECT create_default_user('4000316@empresa.com', '4000316', 'MARCUS CRISAN, IONUT ALEXANDRU', 'squad_lead'::app_role, '4000316');
SELECT create_default_user('4001245@empresa.com', '4001245', 'MARTINEZ DE SORIA RUEDA, ANDER', 'squad_lead'::app_role, '4001245');
SELECT create_default_user('4000465@empresa.com', '4000465', 'MARTINEZ MARTIN, FRANCISCO', 'squad_lead'::app_role, '4000465');
SELECT create_default_user('4001251@empresa.com', '4001251', 'MELERO MILLAN, IVAN', 'squad_lead'::app_role, '4001251');
SELECT create_default_user('4001833@empresa.com', '4001833', 'MIGUEL NIEVA, EDUARDO', 'squad_lead'::app_role, '4001833');
SELECT create_default_user('4000089@empresa.com', '4000089', 'ORTEGA CUEVAS, ANGEL LUIS', 'squad_lead'::app_role, '4000089');
SELECT create_default_user('4000112@empresa.com', '4000112', 'ORTEGA MUNTANE, LUIS JAVIER', 'squad_lead'::app_role, '4000112');
SELECT create_default_user('4000090@empresa.com', '4000090', 'PORTEIRO EIROA, EZEQUIEL', 'squad_lead'::app_role, '4000090');
SELECT create_default_user('4002133@empresa.com', '4002133', 'RABAGO TORRE, VALENTIN', 'squad_lead'::app_role, '4002133');
SELECT create_default_user('4002729@empresa.com', '4002729', 'REVILLA MAILLO, JUAN MANUEL', 'squad_lead'::app_role, '4002729');
SELECT create_default_user('4001527@empresa.com', '4001527', 'RODRIGUEZ FERNANDEZ, BELEN', 'squad_lead'::app_role, '4001527');
SELECT create_default_user('4000147@empresa.com', '4000147', 'ROLDAN COSANO, EMILIO', 'squad_lead'::app_role, '4000147');
SELECT create_default_user('4000535@empresa.com', '4000535', 'ROMERO SALINAS, ESTEFANIA', 'squad_lead'::app_role, '4000535');
SELECT create_default_user('4003058@empresa.com', '4003058', 'ROQUE DIAZ, MANUEL', 'squad_lead'::app_role, '4003058');
SELECT create_default_user('4001949@empresa.com', '4001949', 'SOLAZ TORRES, LUIS', 'squad_lead'::app_role, '4001949');

-- Limpiar función helper
DROP FUNCTION create_default_user(TEXT, TEXT, TEXT, app_role, TEXT);