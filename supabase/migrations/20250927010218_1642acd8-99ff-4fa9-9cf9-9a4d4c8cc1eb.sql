-- Criar função de reconciliação (corrigida) e validação de preço
DROP FUNCTION IF EXISTS public.detailed_balance_reconciliation();

CREATE OR REPLACE FUNCTION public.detailed_balance_reconciliation()
 RETURNS TABLE(
   source_type text,
   total_brl numeric,
   total_rioz numeric,
   transaction_count bigint
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

-- Função para atualizar preço manualmente (evitando triggers)
CREATE OR REPLACE FUNCTION public.update_rate_price(p_symbol text, p_price numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Atualizar sem trigger de change24h
  INSERT INTO rates (symbol, price, change24h, updated_at)
  VALUES (p_symbol, p_price, 0, NOW())
  ON CONFLICT (symbol) DO UPDATE SET
    price = EXCLUDED.price,
    updated_at = EXCLUDED.updated_at;
END;
$function$;