-- Create table for exchange asset API configuration
CREATE TABLE IF NOT EXISTS public.exchange_asset_api_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  api_url TEXT NOT NULL,
  price_field TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exchange_asset_api_config ENABLE ROW LEVEL SECURITY;

-- Admin can manage API configs
CREATE POLICY "Admins can manage exchange API config"
ON public.exchange_asset_api_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Everyone can view API configs (for fetching prices)
CREATE POLICY "Everyone can view exchange API config"
ON public.exchange_asset_api_config
FOR SELECT
USING (true);
