-- Criar função RPC para incrementar balance BRL
CREATE OR REPLACE FUNCTION public.increment_brl_balance(user_id uuid, amount_centavos integer)
RETURNS VOID AS $$
BEGIN
  -- Incrementar balance BRL (amount_centavos está em centavos, converter para reais)
  UPDATE public.balances
  SET 
    brl_balance = brl_balance + (amount_centavos / 100.0),
    updated_at = now()
  WHERE balances.user_id = increment_brl_balance.user_id;
  
  -- Se o usuário não tem balance, criar um
  IF NOT FOUND THEN
    INSERT INTO public.balances (user_id, brl_balance, rioz_balance)
    VALUES (user_id, amount_centavos / 100.0, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;