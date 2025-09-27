-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA

-- 1. Recrear view user_exchange_history_v sem SECURITY DEFINER
DROP VIEW IF EXISTS public.user_exchange_history_v;

CREATE VIEW public.user_exchange_history_v AS
SELECT 
    eo.id,
    eo.user_id,
    eo.side,
    CASE 
        WHEN eo.side = 'buy_rioz' THEN 'Compra RIOZ'
        WHEN eo.side = 'sell_rioz' THEN 'Venda RIOZ'
        ELSE eo.side
    END as operation_type,
    eo.amount_brl,
    eo.amount_rioz, 
    eo.fee_brl,
    eo.fee_rioz,
    eo.price_brl_per_rioz,
    eo.status,
    eo.created_at
FROM public.exchange_orders eo;

-- 2. Recrear view press_mentions_published_v sem SECURITY DEFINER  
DROP VIEW IF EXISTS public.press_mentions_published_v;

CREATE VIEW public.press_mentions_published_v AS
SELECT 
    id,
    title,
    summary,
    vehicle,
    logo_url,
    url,
    published_at,
    created_at
FROM public.press_mentions 
WHERE status = 'published';

-- 3. Inserir taxa inicial na tabela rates se não existir
INSERT INTO public.rates (symbol, price, change24h, updated_at)
VALUES ('RIOZBRL', 0.10, 0.0, now())
ON CONFLICT (symbol) DO NOTHING;

-- 4. Habilitar RLS nas views (elas herdam das tabelas base)
ALTER VIEW public.user_exchange_history_v SET (security_barrier = true);
ALTER VIEW public.press_mentions_published_v SET (security_barrier = true);

-- 5. Adicionar políticas RLS para user_exchange_history_v
CREATE POLICY "Users can view their own exchange history" 
ON public.exchange_orders 
FOR SELECT 
USING (user_id = auth.uid());

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_exchange_orders_user_created 
ON public.exchange_orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rates_symbol 
ON public.rates(symbol);

-- 7. Adicionar função para inicializar balance do usuário
CREATE OR REPLACE FUNCTION public.ensure_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Garantir que o usuário tenha um registro de balance
  INSERT INTO public.balances (user_id, rioz_balance, brl_balance)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar trigger para inicializar balance automaticamente
DROP TRIGGER IF EXISTS ensure_balance_trigger ON public.profiles;
CREATE TRIGGER ensure_balance_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_balance();