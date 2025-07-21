-- Actualizar los niveles de idiomas en la tabla capacities para usar nomenclatura MCER
-- Convertir valores antiguos a nuevos valores MCER

UPDATE capacities 
SET level = CASE 
  WHEN skill LIKE '%Idiomas%' AND level = 'Básico' THEN 'A1'
  WHEN skill LIKE '%Idiomas%' AND level = 'Medio' THEN 'B1'  
  WHEN skill LIKE '%Idiomas%' AND level = 'Alto' THEN 'C1'
  WHEN skill LIKE '%Idiomas%' AND level = 'Experto' THEN 'C2'
  ELSE level
END
WHERE skill LIKE '%Idiomas%' 
  AND level IN ('Básico', 'Medio', 'Alto', 'Experto');