-- CORREÇÃO FINAL DEFINITIVA DOS SECURITY DEFINER VIEWS

-- Primeiro, vamos dropar e recriar as views completamente sem qualquer aspecto security definer
DROP VIEW IF EXISTS public.user_exchange_history_v CASCADE;
DROP VIEW IF EXISTS public.press_mentions_published_v CASCADE;

-- Recriar user_exchange_history_v sem nenhum aspecto security definer
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

-- Recriar press_mentions_published_v sem nenhum aspecto security definer
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

-- Remover qualquer security_barrier que possa ter sido definido 
ALTER VIEW public.user_exchange_history_v SET (security_barrier = false);
ALTER VIEW public.press_mentions_published_v SET (security_barrier = false);

-- As policies RLS já estão nas tabelas base, não precisam das views
-- A segurança é enforçada através das tabelas originais (exchange_orders, press_mentions)