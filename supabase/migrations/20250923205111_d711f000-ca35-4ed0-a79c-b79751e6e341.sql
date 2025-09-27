-- Create increment_balance function for wallet operations
CREATE OR REPLACE FUNCTION public.increment_balance(user_id uuid, amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_balance integer;
BEGIN
  -- Update and return new balance atomically
  UPDATE public.profiles 
  SET saldo_moeda = saldo_moeda + amount
  WHERE id = user_id
  RETURNING saldo_moeda INTO new_balance;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found: %', user_id;
  END IF;
  
  RETURN new_balance;
END;
$$;