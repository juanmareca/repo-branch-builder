-- Habilitar REPLICA IDENTITY FULL para todas las tablas relevantes
ALTER TABLE public.holidays REPLICA IDENTITY FULL;
ALTER TABLE public.persons REPLICA IDENTITY FULL;
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.capacities REPLICA IDENTITY FULL;

-- Agregar las tablas a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.holidays;
ALTER PUBLICATION supabase_realtime ADD TABLE public.persons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.capacities;