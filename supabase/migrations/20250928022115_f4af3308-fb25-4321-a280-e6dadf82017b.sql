-- Drop trigger first and then recreate the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();