-- Corrigir security warnings na view
DROP VIEW IF EXISTS public.user_exchange_history_v;

-- Recriar view sem security definer
CREATE VIEW public.user_exchange_history_v AS
SELECT 
  eo.id,
  eo.user_id,
  eo.side,
  eo.price_brl_per_rioz,
  eo.amount_rioz,
  eo.amount_brl,
  eo.fee_rioz,
  eo.fee_brl,
  eo.status,
  eo.created_at,
  CASE 
    WHEN eo.side = 'buy_rioz' THEN 'Comprou Rioz'
    WHEN eo.side = 'sell_rioz' THEN 'Vendeu Rioz'
  END as operation_type
FROM public.exchange_orders eo
ORDER BY eo.created_at DESC;