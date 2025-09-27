-- Fase 1 - Correções Críticas: Reconciliação, Limit Orders e Telemetria

-- 1. Corrigir função de reconciliação para sistemas separados
CREATE OR REPLACE FUNCTION public.validate_exchange_reconciliation()
 RETURNS TABLE(
   total_users integer, 
   total_rioz_balance numeric, 
   total_brl_balance numeric, 
   exchange_rioz_net numeric, 
   exchange_brl_net numeric, 
   rioz_discrepancy numeric, 
   brl_discrepancy numeric, 
   is_reconciled boolean, 
   last_check timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _total_users INTEGER;
  _total_rioz NUMERIC;
  _total_brl NUMERIC;
  _exchange_rioz NUMERIC;
  _exchange_brl NUMERIC;
  _rioz_diff NUMERIC;
  _brl_diff NUMERIC;
  _is_reconciled BOOLEAN;
BEGIN
  -- Count total users with exchange balances
  SELECT COUNT(*) INTO _total_users FROM balances;
  
  -- Sum all user balances
  SELECT 
    COALESCE(SUM(rioz_balance), 0),
    COALESCE(SUM(brl_balance), 0)
  INTO _total_rioz, _total_brl
  FROM balances;
  
  -- Calculate net positions from exchange_orders (filled orders only)
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN side = 'buy_rioz' THEN amount_rioz - fee_rioz
        WHEN side = 'sell_rioz' THEN -amount_rioz - fee_rioz
        ELSE 0
      END
    ), 0),
    COALESCE(SUM(
      CASE 
        WHEN side = 'buy_rioz' THEN -amount_brl - fee_brl
        WHEN side = 'sell_rioz' THEN amount_brl - fee_brl
        ELSE 0
      END
    ), 0)
  INTO _exchange_rioz, _exchange_brl
  FROM exchange_orders 
  WHERE status = 'filled';
  
  -- Calculate discrepancies (only for exchange system)
  _rioz_diff := _total_rioz - _exchange_rioz;
  _brl_diff := _total_brl - _exchange_brl;
  
  -- Check if reconciled (within 0.01 tolerance)
  _is_reconciled := (ABS(_rioz_diff) <= 0.01 AND ABS(_brl_diff) <= 0.01);
  
  RETURN QUERY SELECT 
    _total_users,
    _total_rioz,
    _total_brl,
    _exchange_rioz,
    _exchange_brl,
    _rioz_diff,
    _brl_diff,
    _is_reconciled,
    NOW();
END;
$function$;

-- 2. Função para executar limit orders automaticamente
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
  -- Primeiro, expirar ordens antigas (>24h)
  UPDATE exchange_orders
  SET status = 'expired',
      cancelled_at = NOW()
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

-- 3. Tabela para telemetria de exchange
CREATE TABLE IF NOT EXISTS public.exchange_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  correlation_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exchange_events_pkey PRIMARY KEY (id)
);

-- 4. Função para registrar eventos de telemetria
CREATE OR REPLACE FUNCTION public.log_exchange_event(
  p_user_id uuid,
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'::jsonb,
  p_correlation_id uuid DEFAULT NULL
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _event_id uuid;
BEGIN
  INSERT INTO exchange_events (user_id, event_type, event_data, correlation_id)
  VALUES (p_user_id, p_event_type, p_event_data, COALESCE(p_correlation_id, gen_random_uuid()))
  RETURNING id INTO _event_id;
  
  RETURN _event_id;
END;
$function$;

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_exchange_orders_execution 
ON exchange_orders (status, side, price_brl_per_rioz, created_at)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_exchange_events_correlation 
ON exchange_events (correlation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_exchange_events_user_type 
ON exchange_events (user_id, event_type, created_at);

-- 6. Política RLS para exchange_events
ALTER TABLE exchange_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exchange events" 
ON exchange_events FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admin can view all exchange events" 
ON exchange_events FOR SELECT 
USING (is_current_user_admin());

-- 7. Validação adicional para exchange_orders
ALTER TABLE exchange_orders 
ADD CONSTRAINT check_positive_amounts 
CHECK (amount_rioz > 0 AND amount_brl > 0 AND price_brl_per_rioz > 0);

ALTER TABLE exchange_orders 
ADD CONSTRAINT check_valid_side 
CHECK (side IN ('buy_rioz', 'sell_rioz'));

-- 8. Função para validar preço antes da execução
CREATE OR REPLACE FUNCTION public.validate_price_freshness(p_max_age_seconds integer DEFAULT 30)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM rates 
    WHERE symbol = 'RIOZBRL' 
      AND updated_at > NOW() - (p_max_age_seconds * INTERVAL '1 second')
  );
END;
$function$;