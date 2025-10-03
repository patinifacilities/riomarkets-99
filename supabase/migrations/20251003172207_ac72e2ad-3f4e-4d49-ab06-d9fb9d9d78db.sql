-- Criar tabela de configurações globais do sistema
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  markets_enabled BOOLEAN DEFAULT true,
  exchange_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Inserir configuração inicial
INSERT INTO public.system_config (markets_enabled, exchange_enabled)
VALUES (true, true)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Policy para admins gerenciarem
CREATE POLICY "Admins can manage system config"
ON public.system_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Policy para todos visualizarem
CREATE POLICY "Everyone can view system config"
ON public.system_config
FOR SELECT
USING (true);

-- Adicionar campo paused para mercados individuais
ALTER TABLE public.markets
ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT false;