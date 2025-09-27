-- Phase 1 Critical Fixes: Atomic RPC and Reconciliation Functions

-- 1. Create atomic limit order execution RPC function
CREATE OR REPLACE FUNCTION public.execute_limit_order_atomic(
  p_order_id UUID,
  p_current_price NUMERIC
) RETURNS TABLE(
  success BOOLEAN,
  error_message TEXT,
  new_rioz_balance NUMERIC,
  new_brl_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order RECORD;
  _current_rioz_balance NUMERIC;
  _current_brl_balance NUMERIC;
  _new_rioz_balance NUMERIC;
  _new_brl_balance NUMERIC;
  _fee_rioz NUMERIC := 0;
  _fee_brl NUMERIC := 0;
  _fee_rate NUMERIC := 0.02; -- 2%
BEGIN
  -- Lock and get order details
  SELECT * INTO _order
  FROM exchange_orders
  WHERE id = p_order_id
    AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Order not found or already processed'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check if order is expired
  IF _order.created_at < NOW() - INTERVAL '24 hours' THEN
    UPDATE exchange_orders 
    SET status = 'expired', 
        cancelled_at = NOW()
    WHERE id = p_order_id;
    
    RETURN QUERY SELECT FALSE, 'Order expired'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check price conditions for limit order execution
  IF (_order.side = 'buy_rioz' AND p_current_price > _order.price_brl_per_rioz) OR
     (_order.side = 'sell_rioz' AND p_current_price < _order.price_brl_per_rioz) THEN
    RETURN QUERY SELECT FALSE, 'Price conditions not met for execution'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Lock and get current balances
  SELECT rioz_balance, brl_balance 
  INTO _current_rioz_balance, _current_brl_balance
  FROM balances
  WHERE user_id = _order.user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Create balance record if it doesn't exist
    INSERT INTO balances (user_id, rioz_balance, brl_balance)
    VALUES (_order.user_id, 0, 0);
    _current_rioz_balance := 0;
    _current_brl_balance := 0;
  END IF;
  
  -- Calculate fees and new balances
  IF _order.side = 'buy_rioz' THEN
    _fee_brl := _order.amount_brl * _fee_rate;
    
    -- Check sufficient BRL balance (including fees)
    IF _current_brl_balance < (_order.amount_brl + _fee_brl) THEN
      RETURN QUERY SELECT FALSE, 'Insufficient BRL balance'::TEXT, _current_rioz_balance, _current_brl_balance;
      RETURN;
    END IF;
    
    _new_brl_balance := _current_brl_balance - _order.amount_brl - _fee_brl;
    _new_rioz_balance := _current_rioz_balance + _order.amount_rioz;
  ELSE -- sell_rioz
    _fee_rioz := _order.amount_rioz * _fee_rate;
    
    -- Check sufficient RIOZ balance (including fees)
    IF _current_rioz_balance < (_order.amount_rioz + _fee_rioz) THEN
      RETURN QUERY SELECT FALSE, 'Insufficient RIOZ balance'::TEXT, _current_rioz_balance, _current_brl_balance;
      RETURN;
    END IF;
    
    _new_rioz_balance := _current_rioz_balance - _order.amount_rioz - _fee_rioz;
    _new_brl_balance := _current_brl_balance + _order.amount_brl;
  END IF;
  
  -- Update balances
  UPDATE balances
  SET rioz_balance = _new_rioz_balance,
      brl_balance = _new_brl_balance,
      updated_at = NOW()
  WHERE user_id = _order.user_id;
  
  -- Update order status
  UPDATE exchange_orders
  SET status = 'filled',
      filled_at = NOW(),
      price_brl_per_rioz = p_current_price,
      fee_rioz = _fee_rioz,
      fee_brl = _fee_brl
  WHERE id = p_order_id;
  
  -- Return success with new balances
  RETURN QUERY SELECT TRUE, 'Order executed successfully'::TEXT, _new_rioz_balance, _new_brl_balance;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error and return failure
  RETURN QUERY SELECT FALSE, SQLSTATE || ': ' || SQLERRM, _current_rioz_balance, _current_brl_balance;
END;
$$;

-- 2. Create comprehensive reconciliation validation function
CREATE OR REPLACE FUNCTION public.validate_accounting_reconciliation()
RETURNS TABLE(
  total_users INTEGER,
  total_rioz_balance NUMERIC,
  total_brl_balance NUMERIC,
  ledger_rioz_net NUMERIC,
  ledger_brl_net NUMERIC,
  rioz_discrepancy NUMERIC,
  brl_discrepancy NUMERIC,
  is_reconciled BOOLEAN,
  last_check TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_users INTEGER;
  _total_rioz NUMERIC;
  _total_brl NUMERIC;
  _ledger_rioz NUMERIC;
  _ledger_brl NUMERIC;
  _rioz_diff NUMERIC;
  _brl_diff NUMERIC;
  _is_reconciled BOOLEAN;
BEGIN
  -- Count total users with balances
  SELECT COUNT(*) INTO _total_users FROM balances;
  
  -- Sum all user balances
  SELECT 
    COALESCE(SUM(rioz_balance), 0),
    COALESCE(SUM(brl_balance), 0)
  INTO _total_rioz, _total_brl
  FROM balances;
  
  -- Calculate net positions from ledger (wallet_transactions)
  SELECT 
    COALESCE(SUM(CASE WHEN tipo = 'credito' THEN valor ELSE -valor END), 0)
  INTO _ledger_rioz
  FROM wallet_transactions;
  
  -- Calculate BRL net from exchange_orders (filled orders)
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN side = 'buy_rioz' THEN -amount_brl - fee_brl
        WHEN side = 'sell_rioz' THEN amount_brl - fee_brl
        ELSE 0
      END
    ), 0)
  INTO _ledger_brl
  FROM exchange_orders 
  WHERE status = 'filled';
  
  -- Calculate discrepancies
  _rioz_diff := _total_rioz - _ledger_rioz;
  _brl_diff := _total_brl - _ledger_brl;
  
  -- Check if reconciled (within 0.01 tolerance)
  _is_reconciled := (ABS(_rioz_diff) <= 0.01 AND ABS(_brl_diff) <= 0.01);
  
  RETURN QUERY SELECT 
    _total_users,
    _total_rioz,
    _total_brl,
    _ledger_rioz,
    _ledger_brl,
    _rioz_diff,
    _brl_diff,
    _is_reconciled,
    NOW();
END;
$$;

-- 3. Create cleanup function for expired orders
CREATE OR REPLACE FUNCTION public.cleanup_expired_limit_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _expired_count INTEGER := 0;
BEGIN
  -- Update expired pending orders
  UPDATE exchange_orders
  SET status = 'expired',
      cancelled_at = NOW()
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';
    
  GET DIAGNOSTICS _expired_count = ROW_COUNT;
  
  RETURN _expired_count;
END;
$$;