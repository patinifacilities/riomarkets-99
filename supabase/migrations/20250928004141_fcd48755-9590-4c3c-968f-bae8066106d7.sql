-- Update initial balance for new users to 10 instead of 1000
UPDATE profiles SET saldo_moeda = 10 WHERE saldo_moeda = 1000;

-- Update the handle_new_user trigger function to give 10 instead of 1000
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Inserir perfil do usuário com 10 moedas em vez de 1000
  INSERT INTO public.profiles (id, nome, email, saldo_moeda)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Usuário'),
    NEW.email,
    10
  );
  
  -- Criar transação de crédito inicial com 10 moedas
  INSERT INTO public.wallet_transactions (id, user_id, tipo, valor, descricao)
  VALUES (
    gen_random_uuid()::text,
    NEW.id,
    'credito',
    10,
    'Crédito inicial de boas-vindas'
  );
  
  RETURN NEW;
END;
$function$;