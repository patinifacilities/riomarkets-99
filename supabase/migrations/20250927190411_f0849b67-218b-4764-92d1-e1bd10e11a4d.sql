-- Add a database function to handle immediate exchange order execution
CREATE OR REPLACE FUNCTION public.execute_market_order(
  p_user_id UUID,
  p_side TEXT, -- 'buy_rioz' or 'sell_rioz'
  p_amount_input NUMERIC,
  p_input_currency TEXT, -- 'BRL' or 'RIOZ'
  p_current_price NUMERIC
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  new_rioz_balance NUMERIC,
  new_brl_balance NUMERIC,
  amount_converted NUMERIC,
  fee_charged NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_rioz_balance NUMERIC;
  _current_brl_balance NUMERIC;
  _new_rioz_balance NUMERIC;
  _new_brl_balance NUMERIC;
  _fee_rate NUMERIC := 0.02; -- 2% fee
  _amount_to_convert NUMERIC;
  _fee_amount NUMERIC;
  _final_amount NUMERIC;
BEGIN
  -- Get current balances with row lock
  SELECT rioz_balance, brl_balance 
  INTO _current_rioz_balance, _current_brl_balance
  FROM balances
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- If balance doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO balances (user_id, rioz_balance, brl_balance)
    VALUES (p_user_id, 0, 0);
    _current_rioz_balance := 0;
    _current_brl_balance := 0;
  END IF;
  
  -- Calculate amounts based on operation type
  IF p_side = 'buy_rioz' THEN
    -- Buying RIOZ with BRL
    IF p_input_currency = 'BRL' THEN
      _amount_to_convert := p_amount_input;
    ELSE
      -- Input is RIOZ amount, convert to BRL needed
      _amount_to_convert := p_amount_input * p_current_price;
    END IF;
    
    _fee_amount := _amount_to_convert * _fee_rate;
    
    -- Check if user has enough BRL (including fee)
    IF _current_brl_balance < (_amount_to_convert + _fee_amount) THEN
      RETURN QUERY SELECT FALSE, 'Saldo BRL insuficiente', _current_rioz_balance, _current_brl_balance, 0::NUMERIC, 0::NUMERIC;
      RETURN;
    END IF;
    
    -- Calculate final RIOZ amount after fee
    _final_amount := (_amount_to_convert - _fee_amount) / p_current_price;
    
    -- Update balances
    _new_brl_balance := _current_brl_balance - _amount_to_convert;
    _new_rioz_balance := _current_rioz_balance + _final_amount;
    
  ELSE -- sell_rioz
    -- Selling RIOZ for BRL
    IF p_input_currency = 'RIOZ' THEN
      _amount_to_convert := p_amount_input;
    ELSE
      -- Input is BRL amount, convert to RIOZ needed
      _amount_to_convert := p_amount_input / p_current_price;
    END IF;
    
    _fee_amount := _amount_to_convert * _fee_rate;
    
    -- Check if user has enough RIOZ (including fee)
    IF _current_rioz_balance < (_amount_to_convert + _fee_amount) THEN
      RETURN QUERY SELECT FALSE, 'Saldo RIOZ insuficiente', _current_rioz_balance, _current_brl_balance, 0::NUMERIC, 0::NUMERIC;
      RETURN;
    END IF;
    
    -- Calculate final BRL amount after fee
    _final_amount := (_amount_to_convert - _fee_amount) * p_current_price;
    
    -- Update balances
    _new_rioz_balance := _current_rioz_balance - _amount_to_convert;
    _new_brl_balance := _current_brl_balance + _final_amount;
  END IF;
  
  -- Update the balances
  UPDATE balances
  SET rioz_balance = _new_rioz_balance,
      brl_balance = _new_brl_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the transaction in exchange_orders for history
  INSERT INTO exchange_orders (
    user_id,
    side,
    price_brl_per_rioz,
    amount_rioz,
    amount_brl,
    fee_rioz,
    fee_brl,
    status,
    filled_at
  ) VALUES (
    p_user_id,
    p_side,
    p_current_price,
    CASE WHEN p_side = 'buy_rioz' THEN _final_amount ELSE _amount_to_convert END,
    CASE WHEN p_side = 'buy_rioz' THEN _amount_to_convert ELSE _final_amount END,
    CASE WHEN p_side = 'buy_rioz' THEN 0 ELSE _fee_amount END,
    CASE WHEN p_side = 'buy_rioz' THEN _fee_amount ELSE 0 END,
    'filled',
    NOW()
  );
  
  RETURN QUERY SELECT TRUE, 'Ordem executada com sucesso', _new_rioz_balance, _new_brl_balance, _final_amount, _fee_amount;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, SQLSTATE || ': ' || SQLERRM, _current_rioz_balance, _current_brl_balance, 0::NUMERIC, 0::NUMERIC;
END;
$$;