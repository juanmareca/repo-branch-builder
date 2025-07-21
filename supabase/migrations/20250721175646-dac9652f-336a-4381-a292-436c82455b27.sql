-- Crear tabla para guardar las preferencias de orden de tarjetas del Squad Lead
CREATE TABLE public.squad_lead_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_lead_name TEXT NOT NULL,
  card_order TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(squad_lead_name)
);

-- Enable Row Level Security
ALTER TABLE public.squad_lead_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for squad lead preferences access
CREATE POLICY "Squad leads can manage their own preferences" 
ON public.squad_lead_preferences 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_squad_lead_preferences_updated_at
BEFORE UPDATE ON public.squad_lead_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();