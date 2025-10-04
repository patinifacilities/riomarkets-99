-- Create table for raffles
CREATE TABLE public.raffles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  prize_description TEXT NOT NULL,
  payout_value NUMERIC NOT NULL DEFAULT 0,
  goal_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  entry_cost INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'active',
  winner_user_id UUID REFERENCES auth.users(id),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for raffle entries
CREATE TABLE public.raffle_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_paid INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for raffles
CREATE POLICY "Everyone can view active raffles"
ON public.raffles FOR SELECT
USING (status = 'active' OR status = 'completed');

CREATE POLICY "Admins can manage raffles"
ON public.raffles FOR ALL
USING (is_current_user_admin());

-- RLS Policies for raffle entries
CREATE POLICY "Users can view their own entries"
ON public.raffle_entries FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create entries"
ON public.raffle_entries FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all entries"
ON public.raffle_entries FOR SELECT
USING (is_current_user_admin());

-- Create indexes
CREATE INDEX idx_raffles_status ON public.raffles(status);
CREATE INDEX idx_raffle_entries_raffle_id ON public.raffle_entries(raffle_id);
CREATE INDEX idx_raffle_entries_user_id ON public.raffle_entries(user_id);

-- Create function to update raffle progress
CREATE OR REPLACE FUNCTION update_raffle_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_total NUMERIC;
BEGIN
  -- Calculate new total
  SELECT COALESCE(SUM(amount_paid), 0)
  INTO _new_total
  FROM raffle_entries
  WHERE raffle_id = NEW.raffle_id;
  
  -- Update raffle current_value
  UPDATE raffles
  SET current_value = _new_total,
      updated_at = now()
  WHERE id = NEW.raffle_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for raffle progress
CREATE TRIGGER on_raffle_entry_created
AFTER INSERT ON raffle_entries
FOR EACH ROW
EXECUTE FUNCTION update_raffle_progress();