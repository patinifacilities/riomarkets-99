-- Create a function to handle bet cancellation with 30% fee
CREATE OR REPLACE FUNCTION public.cancel_bet_with_fee(
  p_order_id text,
  p_user_id uuid
) RETURNS TABLE(
  success boolean,
  message text,
  refund_amount numeric,
  fee_amount numeric
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _order_amount integer;
  _cancel_fee numeric;
  _refund_amount numeric;
  _current_balance integer;
BEGIN
  -- Get order details
  SELECT quantidade_moeda INTO _order_amount
  FROM public.orders
  WHERE id = p_order_id 
    AND user_id = p_user_id 
    AND status = 'ativa';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Ordem não encontrada ou já processada'::text, 0::numeric, 0::numeric;
    RETURN;
  END IF;
  
  -- Calculate fee (30%) and refund amount
  _cancel_fee := _order_amount * 0.30;
  _refund_amount := _order_amount - _cancel_fee;
  
  -- Update order status
  UPDATE public.orders
  SET status = 'cancelada',
      cashed_out_at = now(),
      cashout_amount = _refund_amount
  WHERE id = p_order_id;
  
  -- Create refund transaction
  INSERT INTO public.wallet_transactions (
    id,
    user_id,
    tipo,
    valor,
    descricao,
    market_id
  ) VALUES (
    'cancel_' || p_order_id || '_' || extract(epoch from now())::text,
    p_user_id,
    'credito',
    _refund_amount::integer,
    'Reembolso de cancelamento - Taxa de 30% aplicada',
    null
  );
  
  -- Update user balance
  SELECT increment_balance(p_user_id, _refund_amount::integer) INTO _current_balance;
  
  RETURN QUERY SELECT true, 'Ordem cancelada com sucesso'::text, _refund_amount, _cancel_fee;
END;
$$;