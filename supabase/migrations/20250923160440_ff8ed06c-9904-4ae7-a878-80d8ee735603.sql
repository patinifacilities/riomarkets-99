-- Add market_type column to markets table
ALTER TABLE public.markets 
ADD COLUMN market_type TEXT DEFAULT 'binary' 
CHECK (market_type IN ('binary', 'three_way', 'multi'));

-- Update existing markets to be binary type
UPDATE public.markets SET market_type = 'binary' WHERE market_type IS NULL;

-- Make market_type not null
ALTER TABLE public.markets ALTER COLUMN market_type SET NOT NULL;