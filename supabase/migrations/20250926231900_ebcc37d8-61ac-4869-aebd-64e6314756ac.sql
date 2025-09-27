-- Correções dos problemas identificados

-- 1. Adicionar coluna cancelled_at na tabela exchange_orders
ALTER TABLE exchange_orders 
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS filled_at timestamp with time zone;

-- 2. Corrigir função execute_pending_limit_orders para não usar cancelled_at se não existir
CREATE OR REPLACE FUNCTION public.execute_pending_limit_orders(p_current_price numeric)
 RETURNS TABLE(
   executed_count integer,
   failed_count integer,
   expired_count integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _executed_count INTEGER := 0;
  _failed_count INTEGER := 0;
  _expired_count INTEGER := 0;
  _order RECORD;
  _result RECORD;
BEGIN
  -- Primeiro, expirar ordens antigas (>24h) - usar status apenas
  UPDATE exchange_orders
  SET status = 'expired'
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';
    
  GET DIAGNOSTICS _expired_count = ROW_COUNT;
  
  -- Executar ordens que atendem aos critérios de preço
  FOR _order IN
    SELECT id, user_id, side, price_brl_per_rioz, amount_rioz, amount_brl
    FROM exchange_orders
    WHERE status = 'pending'
      AND created_at >= NOW() - INTERVAL '24 hours'
      AND (
        (side = 'buy_rioz' AND p_current_price <= price_brl_per_rioz) OR
        (side = 'sell_rioz' AND p_current_price >= price_brl_per_rioz)
      )
    ORDER BY created_at ASC
    LIMIT 50 -- Processar no máximo 50 por vez
  LOOP
    -- Executar ordem atomicamente
    SELECT * INTO _result
    FROM execute_limit_order_atomic(_order.id, p_current_price);
    
    IF _result.success THEN
      _executed_count := _executed_count + 1;
    ELSE
      _failed_count := _failed_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT _executed_count, _failed_count, _expired_count;
END;
$function$;

-- 3. Tornar log_exchange_event uma função que não precisa de transação especial
CREATE OR REPLACE FUNCTION public.log_exchange_event(
  p_user_id uuid,
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'::jsonb,
  p_correlation_id uuid DEFAULT NULL
)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  _event_id uuid;
  _correlation_id uuid;
BEGIN
  _correlation_id := COALESCE(p_correlation_id, gen_random_uuid());
  
  INSERT INTO exchange_events (user_id, event_type, event_data, correlation_id)
  VALUES (p_user_id, p_event_type, p_event_data, _correlation_id)
  RETURNING id INTO _event_id;
  
  RETURN _event_id;
END;
$function$;

-- 4. Criar índice para consultas de status
CREATE INDEX IF NOT EXISTS idx_exchange_orders_status_created 
ON exchange_orders (status, created_at DESC);

-- 5. Atualizar constraint para incluir novos status
ALTER TABLE exchange_orders 
DROP CONSTRAINT IF EXISTS check_valid_status;

ALTER TABLE exchange_orders 
ADD CONSTRAINT check_valid_status 
CHECK (status IN ('pending', 'filled', 'cancelled', 'expired', 'failed'));