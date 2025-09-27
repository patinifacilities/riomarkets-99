-- Correções críticas da Fase 1 (versão simplificada)

-- 1. Função para reconciliação detalhada
CREATE OR REPLACE FUNCTION public.detailed_balance_reconciliation()
 RETURNS TABLE(
   source_type text,
   total_brl numeric,
   total_rioz numeric,
   transaction_count integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH balance_totals AS (
    SELECT 
      'user_balances' as source_type,
      COALESCE(SUM(brl_balance), 0) as total_brl,
      COALESCE(SUM(rioz_balance), 0) as total_rioz,
      COUNT(*) as transaction_count
    FROM balances
  ),
  exchange_totals AS (
    SELECT 
      'exchange_orders' as source_type,
      COALESCE(SUM(
        CASE 
          WHEN side = 'buy_rioz' THEN -amount_brl - fee_brl
          WHEN side = 'sell_rioz' THEN amount_brl - fee_brl
          ELSE 0
        END
      ), 0) as total_brl,
      COALESCE(SUM(
        CASE 
          WHEN side = 'buy_rioz' THEN amount_rioz - fee_rioz
          WHEN side = 'sell_rioz' THEN -amount_rioz - fee_rioz
          ELSE 0
        END
      ), 0) as total_rioz,
      COUNT(*) as transaction_count
    FROM exchange_orders 
    WHERE status = 'filled'
  ),
  fiat_totals AS (
    SELECT 
      'fiat_requests' as source_type,
      COALESCE(SUM(
        CASE 
          WHEN status = 'approved' AND request_type = 'deposit' THEN amount_brl
          WHEN status = 'approved' AND request_type = 'withdrawal' THEN -amount_brl
          ELSE 0
        END
      ), 0) as total_brl,
      0::numeric as total_rioz,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as transaction_count
    FROM fiat_requests
  )
  SELECT * FROM balance_totals
  UNION ALL
  SELECT * FROM exchange_totals
  UNION ALL
  SELECT * FROM fiat_totals;
END;
$function$;

-- 2. Função para validar se preços estão atualizados
CREATE OR REPLACE FUNCTION public.is_price_fresh(p_max_age_seconds integer DEFAULT 30)
 RETURNS TABLE(
   is_fresh boolean,
   current_price numeric,
   age_seconds numeric,
   last_update timestamp with time zone
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _rate_record RECORD;
  _age_seconds NUMERIC;
BEGIN
  SELECT price, updated_at 
  INTO _rate_record
  FROM rates 
  WHERE symbol = 'RIOZBRL' 
  ORDER BY updated_at DESC 
  LIMIT 1;
  
  IF _rate_record IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::numeric, 999999::numeric, NULL::timestamp with time zone;
    RETURN;
  END IF;
  
  _age_seconds := EXTRACT(EPOCH FROM (NOW() - _rate_record.updated_at));
  
  RETURN QUERY SELECT 
    (_age_seconds <= p_max_age_seconds),
    _rate_record.price,
    _age_seconds,
    _rate_record.updated_at;
END;
$function$;