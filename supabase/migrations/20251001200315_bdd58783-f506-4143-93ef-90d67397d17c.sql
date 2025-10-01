-- Create table for fast pool algorithm configuration
CREATE TABLE IF NOT EXISTS public.fast_pool_algorithm_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_duration_seconds INTEGER NOT NULL DEFAULT 60,
  odds_start DECIMAL(4,2) NOT NULL DEFAULT 1.80,
  odds_end DECIMAL(4,2) NOT NULL DEFAULT 1.10,
  odds_curve_intensity DECIMAL(4,2) NOT NULL DEFAULT 0.60,
  lockout_time_seconds INTEGER NOT NULL DEFAULT 15,
  max_odds DECIMAL(4,2) NOT NULL DEFAULT 5.00,
  min_odds DECIMAL(4,2) NOT NULL DEFAULT 1.05,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.fast_pool_algorithm_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Algorithm config viewable by admins" 
ON public.fast_pool_algorithm_config 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Algorithm config updatable by admins" 
ON public.fast_pool_algorithm_config 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Algorithm config insertable by admins" 
ON public.fast_pool_algorithm_config 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Insert default configuration
INSERT INTO public.fast_pool_algorithm_config (
  pool_duration_seconds,
  odds_start,
  odds_end,
  odds_curve_intensity,
  lockout_time_seconds,
  max_odds,
  min_odds
) VALUES (60, 1.80, 1.10, 0.60, 15, 5.00, 1.05)
ON CONFLICT DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_algorithm_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_algorithm_config_timestamp
BEFORE UPDATE ON public.fast_pool_algorithm_config
FOR EACH ROW
EXECUTE FUNCTION public.update_algorithm_config_timestamp();