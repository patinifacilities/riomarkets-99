-- Create function to calculate change24h dynamically
CREATE OR REPLACE FUNCTION public.calculate_change24h()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  price_24h_ago NUMERIC;
  current_price NUMERIC;
  change_percent NUMERIC := 0;
BEGIN
  -- Get current price
  current_price := NEW.price;
  
  -- Get price from 24 hours ago
  SELECT price INTO price_24h_ago
  FROM public.rates_history
  WHERE symbol = NEW.symbol 
    AND timestamp <= NOW() - INTERVAL '24 hours'
  ORDER BY timestamp DESC
  LIMIT 1;
  
  -- Calculate change percentage
  IF price_24h_ago IS NOT NULL AND price_24h_ago > 0 THEN
    change_percent := ((current_price - price_24h_ago) / price_24h_ago) * 100;
  END IF;
  
  -- Update change24h in rates table
  UPDATE public.rates 
  SET change24h = ROUND(change_percent, 2)
  WHERE symbol = NEW.symbol;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically populate rates_history when rates change
CREATE OR REPLACE FUNCTION public.populate_rates_history_on_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into rates_history when price changes
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO public.rates_history (symbol, price, volume, timestamp)
    VALUES (NEW.symbol, NEW.price, 1000, NOW());
    
    -- Trigger change24h calculation
    PERFORM public.calculate_change24h_from_history(NEW.symbol);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create function to recalculate change24h from history
CREATE OR REPLACE FUNCTION public.calculate_change24h_from_history(target_symbol TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  price_24h_ago NUMERIC;
  current_price NUMERIC;
  change_percent NUMERIC := 0;
BEGIN
  -- Get current price
  SELECT price INTO current_price
  FROM public.rates
  WHERE symbol = target_symbol;
  
  -- Get price from 24 hours ago
  SELECT price INTO price_24h_ago
  FROM public.rates_history
  WHERE symbol = target_symbol 
    AND timestamp <= NOW() - INTERVAL '24 hours'
  ORDER BY timestamp DESC
  LIMIT 1;
  
  -- Calculate change percentage
  IF price_24h_ago IS NOT NULL AND price_24h_ago > 0 AND current_price IS NOT NULL THEN
    change_percent := ((current_price - price_24h_ago) / price_24h_ago) * 100;
  END IF;
  
  -- Update change24h in rates table
  UPDATE public.rates 
  SET change24h = ROUND(change_percent, 2)
  WHERE symbol = target_symbol;
END;
$function$;

-- Create trigger on rates_history to recalculate change24h
CREATE TRIGGER trigger_calculate_change24h_on_history
  AFTER INSERT ON public.rates_history
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_change24h();

-- Create trigger on rates to populate history
CREATE TRIGGER trigger_populate_rates_history
  BEFORE UPDATE ON public.rates
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_rates_history_on_change();