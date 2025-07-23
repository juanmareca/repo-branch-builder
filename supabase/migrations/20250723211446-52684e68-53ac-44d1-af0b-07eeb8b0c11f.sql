-- Corregir problemas de seguridad en las funciones de base de datos
-- Reemplazar las funciones existentes con versiones más seguras

-- 1. Recrear función update_project_origen con search_path inmutable
CREATE OR REPLACE FUNCTION public.update_project_origen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Si el registro se está actualizando, marcar origen como 'Administrador'
  IF TG_OP = 'UPDATE' THEN
    NEW.origen = 'Administrador';
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Recrear función update_updated_at_column con search_path inmutable
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 3. Recrear función create_audit_log con search_path inmutable
CREATE OR REPLACE FUNCTION public.create_audit_log(p_table_name text, p_record_id text, p_operation text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_user_name text DEFAULT 'Sistema'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_changed_fields text[] := '{}';
  v_key text;
BEGIN
  -- Calcular campos modificados para operaciones UPDATE
  IF p_operation = 'UPDATE' AND p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    FOR v_key IN SELECT jsonb_object_keys(p_new_values)
    LOOP
      IF p_old_values->v_key IS DISTINCT FROM p_new_values->v_key THEN
        v_changed_fields := array_append(v_changed_fields, v_key);
      END IF;
    END LOOP;
  END IF;

  -- Insertar log de auditoría
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    operation,
    old_values,
    new_values,
    changed_fields,
    user_name,
    session_id
  ) VALUES (
    p_table_name,
    p_record_id,
    p_operation,
    p_old_values,
    p_new_values,
    v_changed_fields,
    p_user_name,
    gen_random_uuid()::text
  );
END;
$function$;