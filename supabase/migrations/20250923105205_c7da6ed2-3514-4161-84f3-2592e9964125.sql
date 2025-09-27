-- Create categories table
CREATE TABLE public.categories (
  id text NOT NULL PRIMARY KEY,
  nome text NOT NULL,
  icon_url text,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create ui_events table for telemetry
CREATE TABLE public.ui_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  category_id text,
  event_type text NOT NULL,
  source text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
CREATE POLICY "Everyone can view categories" 
ON public.categories 
FOR SELECT 
USING (ativo = true);

CREATE POLICY "Admin can manage categories" 
ON public.categories 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true 
));

-- RLS policies for ui_events
CREATE POLICY "Users can create their own events" 
ON public.ui_events 
FOR INSERT 
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admin can view all events" 
ON public.ui_events 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true 
));

-- Insert seed data for categories
INSERT INTO public.categories (id, nome, icon_url, ativo, ordem) VALUES
  ('esports', 'E-Sports', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=128&h=128&fit=crop&crop=center', true, 1),
  ('cultura', 'Cultura Pop', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=128&h=128&fit=crop&crop=center', true, 2),
  ('news', 'Notícias', 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=128&h=128&fit=crop&crop=center', true, 3),
  ('politica', 'Política', 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=128&h=128&fit=crop&crop=center', true, 4),
  ('esportes', 'Esportes', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=128&h=128&fit=crop&crop=center', true, 5),
  ('economia', 'Economia', 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=128&h=128&fit=crop&crop=center', true, 6);