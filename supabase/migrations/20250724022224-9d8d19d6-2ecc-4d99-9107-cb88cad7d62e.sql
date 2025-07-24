-- Hacer el email opcional en la tabla profiles
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN email SET DEFAULT '';