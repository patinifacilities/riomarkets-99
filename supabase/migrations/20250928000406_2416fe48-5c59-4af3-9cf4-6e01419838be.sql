-- Create market_orders table to track orders in the order book
CREATE TABLE IF NOT EXISTS public.market_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('sim', 'nao')),
  amount_rioz NUMERIC NOT NULL,
  probability_percent NUMERIC NOT NULL,
  odds NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'filled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  filled_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.market_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view market orders" 
ON public.market_orders 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own market orders" 
ON public.market_orders 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage all market orders" 
ON public.market_orders 
FOR ALL 
USING (public.is_current_user_admin());

-- Create index for faster queries
CREATE INDEX idx_market_orders_market_id ON public.market_orders(market_id);
CREATE INDEX idx_market_orders_status ON public.market_orders(status);
CREATE INDEX idx_market_orders_side ON public.market_orders(side);