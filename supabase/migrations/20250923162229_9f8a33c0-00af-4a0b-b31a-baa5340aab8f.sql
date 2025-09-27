-- Adicionar colunas necessárias na tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS entry_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS entry_multiple NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS cashout_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cashed_out_at TIMESTAMP NULL;

-- Adicionar colunas necessárias na tabela settings
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS cashout_fee_percent NUMERIC DEFAULT 0.02,
ADD COLUMN IF NOT EXISTS token_name TEXT DEFAULT 'Probz Coin';

-- Atualizar configuração existente ou inserir nova
INSERT INTO public.settings (fee_percent, cashout_fee_percent, token_name)
VALUES (0.20, 0.02, 'Probz Coin')
ON CONFLICT (id) DO UPDATE SET
  cashout_fee_percent = EXCLUDED.cashout_fee_percent,
  token_name = EXCLUDED.token_name;

-- Garantir campos necessários na tabela markets (se não existirem)
DO $$ 
BEGIN
  -- Adicionar thumbnail_url se não existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'thumbnail_url') THEN
    ALTER TABLE public.markets ADD COLUMN thumbnail_url TEXT DEFAULT '';
  END IF;
  
  -- Adicionar periodicidade se não existe  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'periodicidade') THEN
    ALTER TABLE public.markets ADD COLUMN periodicidade TEXT DEFAULT '';
  END IF;
  
  -- Adicionar destaque se não existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'destaque') THEN
    ALTER TABLE public.markets ADD COLUMN destaque BOOLEAN DEFAULT false;
  END IF;
  
  -- Adicionar market_type se não existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'market_type') THEN
    ALTER TABLE public.markets ADD COLUMN market_type TEXT DEFAULT 'binary';
  END IF;
END $$;