-- Reset exchange conversion logic to 1:1 simple conversion
-- Update exchange-convert function to handle simple 1:1 conversion without fees
CREATE OR REPLACE FUNCTION exchange_convert_simple(
  p_user_id UUID,
  p_operation TEXT, -- 'buy_rioz' or 'sell_rioz'
  p_amount NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_brl_balance NUMERIC;
  v_rioz_balance NUMERIC;
  v_new_brl_balance NUMERIC;
  v_new_rioz_balance NUMERIC;
  v_result JSON;
BEGIN
  -- Get current balances
  SELECT brl_balance, rioz_balance 
  INTO v_brl_balance, v_rioz_balance
  FROM balances 
  WHERE user_id = p_user_id;
  
  -- If no balance record exists, create one with defaults
  IF NOT FOUND THEN
    INSERT INTO balances (user_id, brl_balance, rioz_balance)
    VALUES (p_user_id, 1000, 0);
    v_brl_balance := 1000;
    v_rioz_balance := 0;
  END IF;
  
  -- Simple 1:1 conversion logic
  IF p_operation = 'buy_rioz' THEN
    -- Check if user has enough BRL
    IF v_brl_balance < p_amount THEN
      RETURN json_build_object('success', false, 'error', 'Saldo BRL insuficiente');
    END IF;
    
    -- Calculate new balances (1:1 conversion)
    v_new_brl_balance := v_brl_balance - p_amount;
    v_new_rioz_balance := v_rioz_balance + p_amount;
    
  ELSIF p_operation = 'sell_rioz' THEN
    -- Check if user has enough RIOZ
    IF v_rioz_balance < p_amount THEN
      RETURN json_build_object('success', false, 'error', 'Saldo RIOZ insuficiente');
    END IF;
    
    -- Calculate new balances (1:1 conversion)
    v_new_brl_balance := v_brl_balance + p_amount;
    v_new_rioz_balance := v_rioz_balance - p_amount;
    
  ELSE
    RETURN json_build_object('success', false, 'error', 'Operação inválida');
  END IF;
  
  -- Update balances
  UPDATE balances 
  SET 
    brl_balance = v_new_brl_balance,
    rioz_balance = v_new_rioz_balance,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Also update profiles table for RIOZ balance compatibility
  UPDATE profiles 
  SET saldo_moeda = v_new_rioz_balance::INTEGER
  WHERE id = p_user_id;
  
  -- Log transaction
  INSERT INTO exchange_orders (
    user_id,
    side,
    price_brl_per_rioz,
    amount_rioz,
    amount_brl,
    fee_brl,
    fee_rioz,
    status,
    filled_at
  ) VALUES (
    p_user_id,
    p_operation,
    1.0, -- 1:1 rate
    p_amount,
    p_amount,
    0, -- No fees
    0, -- No fees
    'filled',
    now()
  );
  
  v_result := json_build_object(
    'success', true,
    'new_brl_balance', v_new_brl_balance,
    'new_rioz_balance', v_new_rioz_balance,
    'amount', p_amount,
    'operation', p_operation
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;