-- Create news_sources table for managing news scraping sources
CREATE TABLE IF NOT EXISTS public.news_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_scraped_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;

-- Admin can manage all news sources
CREATE POLICY "Admin can manage all news sources"
ON public.news_sources
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Everyone can view active news sources
CREATE POLICY "Everyone can view active news sources"
ON public.news_sources
FOR SELECT
USING (is_active = true);

-- Insert some popular Brazilian news sources
INSERT INTO public.news_sources (name, url, logo_url, is_active) VALUES
('G1', 'https://g1.globo.com/', 'https://s2.glbimg.com/0Xuy_Q9XGvhCYCE4_O5k1N8kE7Y=/0x0:174x60/174x60/s.glbimg.com/en/ho/f/original/2015/01/19/g1.png', true),
('Folha de S.Paulo', 'https://www.folha.uol.com.br/', 'https://f.i.uol.com.br/folha/furniture/images/logo-folha-share.png', true),
('O Globo', 'https://oglobo.globo.com/', 'https://s2.glbimg.com/zLxJUAzNeKLyoS8s8xJNPxZlqiU=/0x0:200x200/200x200/s.glbimg.com/en/ho/f/original/2013/04/18/oglobo_app.png', true),
('UOL', 'https://www.uol.com.br/', 'https://conteudo.imguol.com.br/c/noticias/1d/2020/09/22/logo-uol-1600782652901_v2_200x200.png', true),
('Estadão', 'https://www.estadao.com.br/', 'https://img.estadao.com.br/resources/png/logo-estadao-og.png', true),
('BBC Brasil', 'https://www.bbc.com/portuguese', 'https://static.files.bbci.co.uk/core/website/assets/static/icons/blocks/apple-touch-icon.png', true)
ON CONFLICT DO NOTHING;