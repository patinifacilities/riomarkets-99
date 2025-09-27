-- Add new fields to markets table
ALTER TABLE public.markets 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS periodicidade TEXT,
ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT false;

-- Create market_stats table for aggregated data
CREATE TABLE IF NOT EXISTS public.market_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    market_id TEXT NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    vol_total NUMERIC DEFAULT 0,
    vol_24h NUMERIC DEFAULT 0,
    participantes INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(market_id)
);

-- Create user_watchlist table for bookmarks
CREATE TABLE IF NOT EXISTS public.user_watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    market_id TEXT NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, market_id)
);

-- Enable RLS for market_stats
ALTER TABLE public.market_stats ENABLE ROW LEVEL SECURITY;

-- Create policy for market_stats - everyone can view
CREATE POLICY "Everyone can view market stats" 
ON public.market_stats 
FOR SELECT 
USING (true);

-- Enable RLS for user_watchlist
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

-- Create policies for user_watchlist
CREATE POLICY "Users can view their own watchlist" 
ON public.user_watchlist 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watchlist items" 
ON public.user_watchlist 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items" 
ON public.user_watchlist 
FOR DELETE 
USING (auth.uid() = user_id);

-- Function to calculate and update market stats
CREATE OR REPLACE FUNCTION public.update_market_stats(target_market_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    _vol_total numeric := 0;
    _vol_24h numeric := 0;
    _participantes integer := 0;
BEGIN
    -- Calculate total volume
    SELECT COALESCE(SUM(quantidade_moeda), 0) INTO _vol_total
    FROM public.orders
    WHERE market_id = target_market_id AND status = 'ativa';
    
    -- Calculate 24h volume
    SELECT COALESCE(SUM(quantidade_moeda), 0) INTO _vol_24h
    FROM public.orders
    WHERE market_id = target_market_id 
      AND status = 'ativa'
      AND created_at >= now() - interval '24 hours';
    
    -- Calculate unique participants
    SELECT COUNT(DISTINCT user_id) INTO _participantes
    FROM public.orders
    WHERE market_id = target_market_id AND status = 'ativa';
    
    -- Insert or update market stats
    INSERT INTO public.market_stats (market_id, vol_total, vol_24h, participantes, updated_at)
    VALUES (target_market_id, _vol_total, _vol_24h, _participantes, now())
    ON CONFLICT (market_id) 
    DO UPDATE SET 
        vol_total = EXCLUDED.vol_total,
        vol_24h = EXCLUDED.vol_24h,
        participantes = EXCLUDED.participantes,
        updated_at = EXCLUDED.updated_at;
END;
$function$;

-- Function to get market stats (with fallback calculation)
CREATE OR REPLACE FUNCTION public.get_market_stats(target_market_id text)
RETURNS TABLE(
    vol_total numeric,
    vol_24h numeric,
    participantes integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    _vol_total numeric := 0;
    _vol_24h numeric := 0;
    _participantes integer := 0;
BEGIN
    -- Try to get from market_stats first
    SELECT ms.vol_total, ms.vol_24h, ms.participantes
    INTO _vol_total, _vol_24h, _participantes
    FROM public.market_stats ms
    WHERE ms.market_id = target_market_id;
    
    -- If no stats found, calculate on the fly
    IF NOT FOUND THEN
        -- Calculate total volume
        SELECT COALESCE(SUM(quantidade_moeda), 0) INTO _vol_total
        FROM public.orders
        WHERE market_id = target_market_id AND status = 'ativa';
        
        -- Calculate 24h volume
        SELECT COALESCE(SUM(quantidade_moeda), 0) INTO _vol_24h
        FROM public.orders
        WHERE market_id = target_market_id 
          AND status = 'ativa'
          AND created_at >= now() - interval '24 hours';
        
        -- Calculate unique participants
        SELECT COUNT(DISTINCT user_id) INTO _participantes
        FROM public.orders
        WHERE market_id = target_market_id AND status = 'ativa';
    END IF;
    
    RETURN QUERY SELECT _vol_total, _vol_24h, _participantes;
END;
$function$;