-- Create user_rankings table for tracking user performance and rankings
CREATE TABLE IF NOT EXISTS public.user_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  total_bets INTEGER NOT NULL DEFAULT 0,
  accuracy_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_profit NUMERIC NOT NULL DEFAULT 0,
  total_wagered NUMERIC NOT NULL DEFAULT 0,
  win_streak INTEGER NOT NULL DEFAULT 0,
  best_win_streak INTEGER NOT NULL DEFAULT 0,
  rank_position INTEGER,
  rank_tier TEXT NOT NULL DEFAULT 'iniciante',
  last_bet_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_rankings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all rankings"
  ON public.user_rankings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own ranking"
  ON public.user_rankings
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert rankings"
  ON public.user_rankings
  FOR INSERT
  WITH CHECK (true);

-- Create index for ranking queries
CREATE INDEX IF NOT EXISTS idx_user_rankings_accuracy ON public.user_rankings(accuracy_percent DESC);
CREATE INDEX IF NOT EXISTS idx_user_rankings_profit ON public.user_rankings(total_profit DESC);
CREATE INDEX IF NOT EXISTS idx_user_rankings_user_id ON public.user_rankings(user_id);

-- Function to update user rankings when an order is completed
CREATE OR REPLACE FUNCTION public.update_user_ranking()
RETURNS TRIGGER AS $$
DECLARE
  _user_ranking RECORD;
  _is_win BOOLEAN;
  _profit NUMERIC;
BEGIN
  -- Only process completed orders (ganhou or perdeu)
  IF NEW.status NOT IN ('ganhou', 'perdeu') THEN
    RETURN NEW;
  END IF;

  -- Determine if this was a win
  _is_win := (NEW.status = 'ganhou');
  
  -- Calculate profit/loss
  IF _is_win THEN
    _profit := COALESCE(NEW.cashout_amount, 0) - NEW.quantidade_moeda;
  ELSE
    _profit := -NEW.quantidade_moeda;
  END IF;

  -- Get or create user ranking record
  INSERT INTO public.user_rankings (user_id, total_wins, total_losses, total_bets, total_profit, total_wagered, last_bet_at)
  VALUES (NEW.user_id, 0, 0, 0, 0, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Update ranking stats
  UPDATE public.user_rankings
  SET
    total_wins = total_wins + CASE WHEN _is_win THEN 1 ELSE 0 END,
    total_losses = total_losses + CASE WHEN NOT _is_win THEN 1 ELSE 0 END,
    total_bets = total_bets + 1,
    total_profit = total_profit + _profit,
    total_wagered = total_wagered + NEW.quantidade_moeda,
    accuracy_percent = CASE 
      WHEN (total_bets + 1) > 0 THEN 
        ROUND(((total_wins + CASE WHEN _is_win THEN 1 ELSE 0 END)::NUMERIC / (total_bets + 1)::NUMERIC) * 100, 2)
      ELSE 0
    END,
    win_streak = CASE WHEN _is_win THEN win_streak + 1 ELSE 0 END,
    best_win_streak = CASE 
      WHEN _is_win AND (win_streak + 1) > best_win_streak THEN win_streak + 1
      ELSE best_win_streak
    END,
    last_bet_at = NOW(),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update rankings when orders are completed
DROP TRIGGER IF EXISTS trigger_update_user_ranking ON public.orders;
CREATE TRIGGER trigger_update_user_ranking
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.status IN ('ganhou', 'perdeu') AND OLD.status != NEW.status)
  EXECUTE FUNCTION public.update_user_ranking();

-- Function to update rank positions (should be called periodically)
CREATE OR REPLACE FUNCTION public.update_rank_positions()
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY accuracy_percent DESC, total_profit DESC) as new_rank
    FROM public.user_rankings
    WHERE total_bets >= 5  -- Minimum 5 bets to be ranked
  )
  UPDATE public.user_rankings ur
  SET 
    rank_position = ru.new_rank,
    updated_at = NOW()
  FROM ranked_users ru
  WHERE ur.user_id = ru.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;