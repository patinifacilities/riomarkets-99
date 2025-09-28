-- Create a dedicated exchange order book table for limit orders
CREATE TABLE IF NOT EXISTS public.exchange_order_book (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  amount_rioz NUMERIC NOT NULL CHECK (amount_rioz > 0),
  price_brl_per_rioz NUMERIC NOT NULL CHECK (price_brl_per_rioz > 0),
  remaining_amount NUMERIC NOT NULL CHECK (remaining_amount >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'partially_filled', 'filled', 'cancelled')),
  order_type TEXT NOT NULL DEFAULT 'limit' CHECK (order_type IN ('market', 'limit')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.exchange_order_book ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all active exchange orders" 
ON public.exchange_order_book 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can create their own exchange orders" 
ON public.exchange_order_book 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own exchange orders" 
ON public.exchange_order_book 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_exchange_order_book_active ON public.exchange_order_book(side, price_brl_per_rioz, created_at) WHERE status = 'active';
CREATE INDEX idx_exchange_order_book_user ON public.exchange_order_book(user_id, status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_exchange_order_book_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exchange_order_book_updated_at
BEFORE UPDATE ON public.exchange_order_book
FOR EACH ROW
EXECUTE FUNCTION public.update_exchange_order_book_updated_at();