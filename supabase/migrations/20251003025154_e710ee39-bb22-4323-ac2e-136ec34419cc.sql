-- Create branding_config table
CREATE TABLE IF NOT EXISTS public.branding_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  logo_white_url text,
  logo_black_url text,
  background_color text DEFAULT '#0a0a0a',
  primary_color text DEFAULT '#ff2389',
  success_color text DEFAULT '#00ff90',
  active_theme text DEFAULT 'theme1',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.branding_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view branding config"
  ON public.branding_config
  FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage branding config"
  ON public.branding_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert default config
INSERT INTO public.branding_config (
  logo_url,
  logo_white_url,
  logo_black_url,
  background_color,
  primary_color,
  success_color,
  active_theme
) VALUES (
  '/assets/rio-markets-logo.png',
  '/assets/rio-white-logo.png',
  '/assets/rio-black-logo.png',
  '#0a0a0a',
  '#ff2389',
  '#00ff90',
  'theme1'
) ON CONFLICT DO NOTHING;