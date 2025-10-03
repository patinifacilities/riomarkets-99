-- Create exchange_assets table for managing exchange assets
CREATE TABLE IF NOT EXISTS public.exchange_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exchange_assets ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active assets
CREATE POLICY "Everyone can view active exchange assets"
  ON public.exchange_assets
  FOR SELECT
  USING (is_active = true);

-- Allow admins to manage assets
CREATE POLICY "Admins can manage exchange assets"
  ON public.exchange_assets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert default assets (RIOZ and BRL)
INSERT INTO public.exchange_assets (symbol, name, is_active)
VALUES 
  ('RIOZ', 'Probz Coin', true),
  ('BRL', 'Real Brasileiro', true)
ON CONFLICT (symbol) DO NOTHING;

-- Add update trigger
CREATE TRIGGER update_exchange_assets_updated_at
  BEFORE UPDATE ON public.exchange_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();