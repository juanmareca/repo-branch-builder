-- Limpiar políticas RLS duplicadas para optimizar rendimiento

-- Eliminar políticas duplicadas en audit_logs
DROP POLICY IF EXISTS "Allow read access for audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow insert for audit_logs" ON public.audit_logs;

-- Eliminar política duplicada en projects
DROP POLICY IF EXISTS "Enable all access for projects" ON public.projects;

-- Las políticas public_access_* ya proporcionan el acceso completo necesario