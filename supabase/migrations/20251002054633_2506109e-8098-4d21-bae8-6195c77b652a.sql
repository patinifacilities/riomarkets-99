-- Create table for tracking user login streaks
CREATE TABLE public.user_login_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  total_logins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for tracking claimed rewards
CREATE TABLE public.user_rewards_claimed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL, -- '7_day', '30_day', etc
  reward_amount INTEGER NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  streak_at_claim INTEGER NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_login_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards_claimed ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_login_streaks
CREATE POLICY "Users can view their own login streaks"
ON public.user_login_streaks
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own login streaks"
ON public.user_login_streaks
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own login streaks"
ON public.user_login_streaks
FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for user_rewards_claimed
CREATE POLICY "Users can view their own claimed rewards"
ON public.user_rewards_claimed
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own claimed rewards"
ON public.user_rewards_claimed
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create function to update login streak
CREATE OR REPLACE FUNCTION public.update_user_login_streak(p_user_id UUID)
RETURNS TABLE(current_streak INTEGER, is_new_login BOOLEAN, can_claim_7_day BOOLEAN, can_claim_30_day BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_login_date DATE;
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
  v_total_logins INTEGER := 0;
  v_is_new_login BOOLEAN := FALSE;
  v_claimed_7_day BOOLEAN := FALSE;
  v_claimed_30_day BOOLEAN := FALSE;
  v_can_claim_7 BOOLEAN := FALSE;
  v_can_claim_30 BOOLEAN := FALSE;
BEGIN
  -- Get existing streak data
  SELECT last_login_date, user_login_streaks.current_streak, longest_streak, total_logins
  INTO v_last_login_date, v_current_streak, v_longest_streak, v_total_logins
  FROM public.user_login_streaks
  WHERE user_id = p_user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_login_streaks (user_id, current_streak, longest_streak, last_login_date, total_logins)
    VALUES (p_user_id, 1, 1, CURRENT_DATE, 1);
    
    RETURN QUERY SELECT 1, TRUE, FALSE, FALSE;
    RETURN;
  END IF;
  
  -- If already logged in today, return current streak
  IF v_last_login_date = CURRENT_DATE THEN
    -- Check if rewards can be claimed
    SELECT EXISTS(SELECT 1 FROM user_rewards_claimed WHERE user_id = p_user_id AND reward_type = '7_day') INTO v_claimed_7_day;
    SELECT EXISTS(SELECT 1 FROM user_rewards_claimed WHERE user_id = p_user_id AND reward_type = '30_day') INTO v_claimed_30_day;
    
    v_can_claim_7 := (v_current_streak >= 7 AND NOT v_claimed_7_day);
    v_can_claim_30 := (v_current_streak >= 30 AND NOT v_claimed_30_day);
    
    RETURN QUERY SELECT v_current_streak, FALSE, v_can_claim_7, v_can_claim_30;
    RETURN;
  END IF;
  
  -- Calculate new streak
  IF v_last_login_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day login
    v_current_streak := v_current_streak + 1;
  ELSE
    -- Streak broken, reset to 1
    v_current_streak := 1;
  END IF;
  
  -- Update longest streak if needed
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;
  
  v_total_logins := v_total_logins + 1;
  v_is_new_login := TRUE;
  
  -- Update the record
  UPDATE public.user_login_streaks
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_login_date = CURRENT_DATE,
    total_logins = v_total_logins,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Check if rewards can be claimed
  SELECT EXISTS(SELECT 1 FROM user_rewards_claimed WHERE user_id = p_user_id AND reward_type = '7_day') INTO v_claimed_7_day;
  SELECT EXISTS(SELECT 1 FROM user_rewards_claimed WHERE user_id = p_user_id AND reward_type = '30_day') INTO v_claimed_30_day;
  
  v_can_claim_7 := (v_current_streak >= 7 AND NOT v_claimed_7_day);
  v_can_claim_30 := (v_current_streak >= 30 AND NOT v_claimed_30_day);
  
  RETURN QUERY SELECT v_current_streak, v_is_new_login, v_can_claim_7, v_can_claim_30;
END;
$$;

-- Create function to claim reward
CREATE OR REPLACE FUNCTION public.claim_daily_reward(p_user_id UUID, p_reward_type TEXT, p_reward_amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_streak INTEGER;
  v_already_claimed BOOLEAN;
BEGIN
  -- Check if already claimed
  SELECT EXISTS(SELECT 1 FROM user_rewards_claimed WHERE user_id = p_user_id AND reward_type = p_reward_type) INTO v_already_claimed;
  
  IF v_already_claimed THEN
    RETURN FALSE;
  END IF;
  
  -- Get current streak
  SELECT current_streak INTO v_current_streak FROM user_login_streaks WHERE user_id = p_user_id;
  
  -- Validate streak requirements
  IF (p_reward_type = '7_day' AND v_current_streak < 7) OR
     (p_reward_type = '30_day' AND v_current_streak < 30) THEN
    RETURN FALSE;
  END IF;
  
  -- Record claimed reward
  INSERT INTO user_rewards_claimed (user_id, reward_type, reward_amount, streak_at_claim)
  VALUES (p_user_id, p_reward_type, p_reward_amount, v_current_streak);
  
  -- Add RIOZ to user balance
  UPDATE profiles SET saldo_moeda = saldo_moeda + p_reward_amount WHERE id = p_user_id;
  
  -- Create transaction record
  INSERT INTO wallet_transactions (id, user_id, tipo, valor, descricao)
  VALUES (gen_random_uuid()::text, p_user_id, 'credito', p_reward_amount, 'Recompensa de streak - ' || p_reward_type);
  
  RETURN TRUE;
END;
$$;