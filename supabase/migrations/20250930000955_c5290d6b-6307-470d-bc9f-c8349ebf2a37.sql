-- Create fast_pools table for persistent Fast Market pools
CREATE TABLE IF NOT EXISTS public.fast_pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'commodities',
  asset_symbol TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  question TEXT NOT NULL,
  opening_price NUMERIC,
  closing_price NUMERIC,
  round_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  round_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'processing')),
  result TEXT CHECK (result IN ('subiu', 'desceu', 'manteve')),
  base_odds NUMERIC NOT NULL DEFAULT 1.65,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fast_pool_bets table for user bets
CREATE TABLE IF NOT EXISTS public.fast_pool_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pool_id UUID NOT NULL REFERENCES public.fast_pools(id),
  side TEXT NOT NULL CHECK (side IN ('subiu', 'desceu')),
  amount_rioz NUMERIC NOT NULL,
  odds NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT false,
  payout_amount NUMERIC DEFAULT 0
);

-- Create fast_pool_results table for historical results
CREATE TABLE IF NOT EXISTS public.fast_pool_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id UUID NOT NULL REFERENCES public.fast_pools(id),
  asset_symbol TEXT NOT NULL,
  opening_price NUMERIC NOT NULL,
  closing_price NUMERIC NOT NULL,
  price_change_percent NUMERIC NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('subiu', 'desceu', 'manteve')),
  total_bets_subiu NUMERIC DEFAULT 0,
  total_bets_desceu NUMERIC DEFAULT 0,
  winners_count INTEGER DEFAULT 0,
  total_payout NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fast_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fast_pool_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fast_pool_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fast_pools
CREATE POLICY "Everyone can view active fast pools" 
ON public.fast_pools 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage fast pools" 
ON public.fast_pools 
FOR ALL 
USING (is_current_user_admin());

-- RLS Policies for fast_pool_bets
CREATE POLICY "Users can create their own fast pool bets" 
ON public.fast_pool_bets 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own fast pool bets" 
ON public.fast_pool_bets 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admin can view all fast pool bets" 
ON public.fast_pool_bets 
FOR SELECT 
USING (is_current_user_admin());

-- RLS Policies for fast_pool_results
CREATE POLICY "Everyone can view fast pool results" 
ON public.fast_pool_results 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage fast pool results" 
ON public.fast_pool_results 
FOR ALL 
USING (is_current_user_admin());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fast_pools_status_round ON public.fast_pools(status, round_number);
CREATE INDEX IF NOT EXISTS idx_fast_pools_category ON public.fast_pools(category);
CREATE INDEX IF NOT EXISTS idx_fast_pool_bets_user_id ON public.fast_pool_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_fast_pool_bets_pool_id ON public.fast_pool_bets(pool_id);
CREATE INDEX IF NOT EXISTS idx_fast_pool_results_pool_id ON public.fast_pool_results(pool_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_fast_pools_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_fast_pools_updated_at ON public.fast_pools;
CREATE TRIGGER update_fast_pools_updated_at
BEFORE UPDATE ON public.fast_pools
FOR EACH ROW
EXECUTE FUNCTION public.update_fast_pools_updated_at_column();