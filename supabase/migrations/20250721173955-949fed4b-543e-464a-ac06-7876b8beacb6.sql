-- Actualizar los valores restantes de idiomas para completar la nomenclatura MCER
-- Convertir Bilingüe a C2 y Nulo a Pre-A1

UPDATE capacities 
SET level = CASE 
  WHEN skill LIKE '%Idiomas%' AND level = 'Bilingüe' THEN 'C2'
  WHEN skill LIKE '%Idiomas%' AND level = 'Nulo' THEN 'Pre-A1'
  ELSE level
END
WHERE skill LIKE '%Idiomas%' 
  AND level IN ('Bilingüe', 'Nulo');