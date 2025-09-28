-- Fix security definer views by creating them as regular views instead
-- Remove the existing views and recreate them properly

DROP VIEW IF EXISTS public.press_mentions_published_v;
DROP VIEW IF EXISTS public.user_exchange_history_v;

-- Recreate press_mentions_published_v as a regular view (not security definer)
CREATE VIEW public.press_mentions_published_v AS
SELECT 
  id,
  title,
  url,
  vehicle,
  logo_url,
  summary,
  created_at,
  published_at
FROM public.press_mentions
WHERE status = 'published';

-- Recreate user_exchange_history_v as a regular view (not security definer) 
CREATE VIEW public.user_exchange_history_v AS
SELECT 
  id,
  user_id,
  side,
  'exchange' as operation_type,
  price_brl_per_rioz,
  amount_rioz,
  amount_brl,
  fee_rioz,
  fee_brl,
  status,
  created_at
FROM public.exchange_orders;