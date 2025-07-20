-- Add 'origen' column to persons table
ALTER TABLE public.persons 
ADD COLUMN origen text NOT NULL DEFAULT 'Fichero';

-- Update existing records to have 'Fichero' as default value
UPDATE public.persons 
SET origen = 'Fichero' 
WHERE origen IS NULL;