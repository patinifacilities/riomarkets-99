-- Create Order Book tables and structures
CREATE TABLE public.orderbook_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL DEFAULT 'RIOZBRL',
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rates history for depth chart
CREATE TABLE public.rates_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL DEFAULT 'RIOZBRL',
  price NUMERIC NOT NULL,
  volume NUMERIC NOT NULL DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orderbook ticks for transaction history
CREATE TABLE public.orderbook_ticks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL DEFAULT 'RIOZBRL',
  price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orderbook_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rates_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orderbook_ticks ENABLE ROW LEVEL SECURITY;

-- Create policies - everyone can view orderbook data
CREATE POLICY "Everyone can view orderbook levels" 
ON public.orderbook_levels 
FOR SELECT 
USING (true);

CREATE POLICY "Everyone can view rates history" 
ON public.rates_history 
FOR SELECT 
USING (true);

CREATE POLICY "Everyone can view orderbook ticks" 
ON public.orderbook_ticks 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_orderbook_levels_symbol_side_price ON public.orderbook_levels (symbol, side, price DESC);
CREATE INDEX idx_orderbook_levels_updated_at ON public.orderbook_levels (updated_at DESC);
CREATE INDEX idx_rates_history_symbol_timestamp ON public.rates_history (symbol, timestamp DESC);
CREATE INDEX idx_orderbook_ticks_symbol_timestamp ON public.orderbook_ticks (symbol, timestamp DESC);

-- Create function to generate realistic orderbook data
CREATE OR REPLACE FUNCTION public.generate_orderbook_levels()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_price NUMERIC;
  level_price NUMERIC;
  base_volume NUMERIC := 10000;
  spread_percent NUMERIC := 0.002; -- 0.2% spread
  i INTEGER;
BEGIN
  -- Get current price
  SELECT price INTO current_price 
  FROM public.rates 
  WHERE symbol = 'RIOZBRL' 
  ORDER BY updated_at DESC 
  LIMIT 1;
  
  IF current_price IS NULL THEN
    current_price := 5.50; -- Default price
  END IF;
  
  -- Clear existing levels
  DELETE FROM public.orderbook_levels WHERE symbol = 'RIOZBRL';
  
  -- Generate buy levels (below current price)
  FOR i IN 1..15 LOOP
    level_price := current_price * (1 - spread_percent/2 - (i * 0.001));
    INSERT INTO public.orderbook_levels (symbol, side, price, quantity, total_value, orders_count)
    VALUES (
      'RIOZBRL',
      'buy',
      ROUND(level_price, 4),
      ROUND(base_volume * EXP(-i * 0.3), 2),
      ROUND(level_price * base_volume * EXP(-i * 0.3), 2),
      FLOOR(RANDOM() * 5) + 1
    );
  END LOOP;
  
  -- Generate sell levels (above current price)
  FOR i IN 1..15 LOOP
    level_price := current_price * (1 + spread_percent/2 + (i * 0.001));
    INSERT INTO public.orderbook_levels (symbol, side, price, quantity, total_value, orders_count)
    VALUES (
      'RIOZBRL',
      'sell',
      ROUND(level_price, 4),
      ROUND(base_volume * EXP(-i * 0.3), 2),
      ROUND(level_price * base_volume * EXP(-i * 0.3), 2),
      FLOOR(RANDOM() * 5) + 1
    );
  END LOOP;
  
  -- Insert current price tick
  INSERT INTO public.orderbook_ticks (symbol, price, quantity, side)
  VALUES ('RIOZBRL', current_price, 100, 'buy');
  
  -- Maintain rates history
  INSERT INTO public.rates_history (symbol, price, volume)
  VALUES ('RIOZBRL', current_price, base_volume)
  ON CONFLICT DO NOTHING;
  
END;
$$;

-- Create trigger to update orderbook when rates change
CREATE OR REPLACE FUNCTION public.update_orderbook_on_rate_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if price actually changed
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    PERFORM public.generate_orderbook_levels();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_orderbook_on_rate_change
  AFTER UPDATE ON public.rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_orderbook_on_rate_change();

-- Initial generation
SELECT public.generate_orderbook_levels();