-- Añadir 'project' como valor válido para el tipo de asignación
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_type_check;
ALTER TABLE assignments ADD CONSTRAINT assignments_type_check 
CHECK (type IN ('development', 'analysis', 'support', 'testing', 'project'));