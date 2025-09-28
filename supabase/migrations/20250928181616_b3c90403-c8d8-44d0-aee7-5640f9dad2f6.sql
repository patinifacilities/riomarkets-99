-- Fix cancel bet functionality by allowing 'cancelada' status
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('ativa', 'liquidada', 'cancelada'));

-- Create market-specific order book table for real order matching
CREATE TABLE IF NOT EXISTS public.market_order_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT NOT NULL REFERENCES public.markets(id),
  user_id UUID NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('sim', 'nao')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  filled_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_market_order_book_market_side_price 
ON public.market_order_book(market_id, side, price);

-- Function to execute market opinion orders with matching logic
CREATE OR REPLACE FUNCTION public.execute_market_opinion_order(
  p_market_id TEXT,
  p_user_id UUID,
  p_side TEXT,
  p_quantity INTEGER,
  p_price NUMERIC
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  matched_quantity INTEGER,
  remaining_quantity INTEGER,
  new_order_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _opposite_side TEXT;
  _matched_quantity INTEGER := 0;
  _remaining_quantity INTEGER := p_quantity;
  _order_id UUID;
  _match_record RECORD;
  _match_quantity INTEGER;
BEGIN
  -- Determine opposite side
  _opposite_side := CASE WHEN p_side = 'sim' THEN 'nao' ELSE 'sim' END;
  
  -- Try to match against existing orders
  FOR _match_record IN
    SELECT id, user_id, quantity, price
    FROM market_order_book
    WHERE market_id = p_market_id
      AND side = _opposite_side
      AND status = 'pending'
      AND price = p_price  -- Exact price match for now
    ORDER BY created_at ASC  -- FIFO matching
  LOOP
    -- Calculate how much we can match
    _match_quantity := LEAST(_remaining_quantity, _match_record.quantity);
    
    -- Update the matched order
    IF _match_quantity = _match_record.quantity THEN
      -- Fully filled
      UPDATE market_order_book
      SET status = 'filled', filled_at = NOW()
      WHERE id = _match_record.id;
    ELSE
      -- Partially filled
      UPDATE market_order_book
      SET quantity = quantity - _match_quantity
      WHERE id = _match_record.id;
    END IF;
    
    -- Create order records in the orders table for both sides
    INSERT INTO orders (
      id, user_id, market_id, opcao_escolhida, quantidade_moeda,
      preco, status, entry_percent, entry_multiple
    ) VALUES (
      gen_random_uuid()::TEXT, p_user_id, p_market_id, p_side, _match_quantity,
      p_price, 'ativa', 50, p_price
    );
    
    INSERT INTO orders (
      id, user_id, market_id, opcao_escolhida, quantidade_moeda,
      preco, status, entry_percent, entry_multiple
    ) VALUES (
      gen_random_uuid()::TEXT, _match_record.user_id, p_market_id, _opposite_side, _match_quantity,
      p_price, 'ativa', 50, p_price
    );
    
    -- Update counters
    _matched_quantity := _matched_quantity + _match_quantity;
    _remaining_quantity := _remaining_quantity - _match_quantity;
    
    -- Break if fully matched
    EXIT WHEN _remaining_quantity = 0;
  END LOOP;
  
  -- If there's remaining quantity, create an order book entry
  IF _remaining_quantity > 0 THEN
    INSERT INTO market_order_book (
      market_id, user_id, side, quantity, price
    ) VALUES (
      p_market_id, p_user_id, p_side, _remaining_quantity, p_price
    ) RETURNING id INTO _order_id;
  END IF;
  
  RETURN QUERY SELECT 
    TRUE,
    'Order processed successfully'::TEXT,
    _matched_quantity,
    _remaining_quantity,
    _order_id;
    
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    FALSE,
    SQLSTATE || ': ' || SQLERRM,
    0,
    p_quantity,
    NULL::UUID;
END;
$$;