-- ARREGLO URGENTE: Reactivar RLS y crear políticas simples para que funcionen los squad leads

-- Reactivar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política temporal que permite TODO para que funcione inmediatamente
CREATE POLICY "allow_all_profiles_temp" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Para las otras tablas también, crear políticas que permitan acceso total
CREATE POLICY "allow_all_persons_temp" ON public.persons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_projects_temp" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_assignments_temp" ON public.assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_capacities_temp" ON public.capacities FOR ALL USING (true) WITH CHECK (true);