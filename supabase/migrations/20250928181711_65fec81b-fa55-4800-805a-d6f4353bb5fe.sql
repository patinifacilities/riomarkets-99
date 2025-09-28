-- Enable RLS on the market_order_book table
ALTER TABLE public.market_order_book ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the market_order_book table
CREATE POLICY "Users can view market order book entries" 
ON public.market_order_book 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own market order book entries" 
ON public.market_order_book 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own market order book entries" 
ON public.market_order_book 
FOR UPDATE 
USING (user_id = auth.uid());