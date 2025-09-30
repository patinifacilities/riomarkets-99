-- Create fast_pool_configs table for general pool configurations
CREATE TABLE IF NOT EXISTS public.fast_pool_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol TEXT NOT NULL UNIQUE,
  asset_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'commodities',
  question TEXT NOT NULL,
  base_odds NUMERIC NOT NULL DEFAULT 1.65,
  api_connected BOOLEAN DEFAULT false,
  api_url TEXT,
  api_key TEXT,
  webhook_url TEXT,
  paused BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fast_pool_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view fast pool configs"
  ON public.fast_pool_configs
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage fast pool configs"
  ON public.fast_pool_configs
  FOR ALL
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_fast_pool_configs_updated_at
  BEFORE UPDATE ON public.fast_pool_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fast_pools_updated_at_column();

-- Migrate existing data from fast_pools to fast_pool_configs
INSERT INTO public.fast_pool_configs (asset_symbol, asset_name, category, question, base_odds, api_connected, api_url, api_key, webhook_url, paused)
SELECT DISTINCT ON (asset_symbol, category)
  asset_symbol,
  asset_name,
  category,
  question,
  base_odds,
  api_connected,
  api_url,
  api_key,
  webhook_url,
  paused
FROM public.fast_pools
ORDER BY asset_symbol, category, created_at DESC
ON CONFLICT (asset_symbol) DO NOTHING;