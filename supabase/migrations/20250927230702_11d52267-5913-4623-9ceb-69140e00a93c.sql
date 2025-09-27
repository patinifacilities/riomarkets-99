-- Drop cascade to remove dependent triggers
DROP FUNCTION IF EXISTS public.populate_rates_history_on_change() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_change24h() CASCADE;

-- Update RIOZ price to 1.00 BRL manually
UPDATE public.rates 
SET price = 1.00, change24h = 0, updated_at = NOW() 
WHERE symbol = 'RIOZBRL';

-- Insert if doesn't exist
INSERT INTO public.rates (symbol, price, change24h, updated_at)
SELECT 'RIOZBRL', 1.00, 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.rates WHERE symbol = 'RIOZBRL');