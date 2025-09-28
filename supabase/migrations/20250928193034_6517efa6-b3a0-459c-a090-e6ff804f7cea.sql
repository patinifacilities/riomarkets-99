-- Create market order book table for pool-specific order books
CREATE TABLE IF NOT EXISTS public.market_order_book_pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  side TEXT NOT NULL, -- 'sim' or 'nao'
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'filled', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  filled_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.market_order_book_pools ENABLE ROW LEVEL SECURITY;

-- Create policies for market_order_book_pools
CREATE POLICY "Users can create their own market pool orders"
ON public.market_order_book_pools
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view market pool orders"
ON public.market_order_book_pools
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own market pool orders"
ON public.market_order_book_pools
FOR UPDATE
USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX idx_market_order_book_pools_market_id ON public.market_order_book_pools(market_id);
CREATE INDEX idx_market_order_book_pools_user_id ON public.market_order_book_pools(user_id);
CREATE INDEX idx_market_order_book_pools_status ON public.market_order_book_pools(status);