-- CORREÇÃO FINAL DAS SECURITY DEFINER VIEWS

-- Verificar se ainda há alguma view SECURITY DEFINER e removê-la
-- (As views recriadas anteriormente já foram corretas, mas vamos garantir)

-- Corrigir search_path nas funções existentes
CREATE OR REPLACE FUNCTION public.ensure_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Garantir que o usuário tenha um registro de balance
  INSERT INTO public.balances (user_id, rioz_balance, brl_balance)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Corrigir outras funções existentes com search_path
CREATE OR REPLACE FUNCTION public.initialize_user_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.balances (user_id, rioz_balance, brl_balance)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Inserir perfil do usuário
  INSERT INTO public.profiles (id, nome, email, saldo_moeda)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Usuário'),
    NEW.email,
    1000
  );
  
  -- Criar transação de crédito inicial
  INSERT INTO public.wallet_transactions (id, user_id, tipo, valor, descricao)
  VALUES (
    gen_random_uuid()::text,
    NEW.id,
    'credito',
    1000,
    'Crédito inicial de boas-vindas'
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.close_expired_markets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.markets 
  SET status = 'fechado'
  WHERE status = 'aberto' 
    AND end_date < now();
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Simple check using auth.uid() directly against profiles table
  -- This avoids the recursion issue by not being called from within RLS policies
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_market_pools(market_id text)
RETURNS TABLE(pool_sim numeric, pool_nao numeric, total_pool numeric, percent_sim numeric, percent_nao numeric, projected_fee numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _pool_sim numeric := 0;
  _pool_nao numeric := 0;
  _total_pool numeric := 0;
  _fee_percent numeric := 0.20;
BEGIN
  -- Calcular pool Sim (fix ambiguous column reference)
  SELECT COALESCE(SUM(o.quantidade_moeda), 0) INTO _pool_sim
  FROM public.orders o
  WHERE o.market_id = get_market_pools.market_id
    AND o.opcao_escolhida = 'sim'
    AND o.status = 'ativa';
    
  -- Calcular pool Não (fix ambiguous column reference)
  SELECT COALESCE(SUM(o.quantidade_moeda), 0) INTO _pool_nao
  FROM public.orders o
  WHERE o.market_id = get_market_pools.market_id
    AND o.opcao_escolhida = 'nao'
    AND o.status = 'ativa';
    
  _total_pool := _pool_sim + _pool_nao;
  
  -- Retornar resultados
  RETURN QUERY SELECT
    _pool_sim,
    _pool_nao,
    _total_pool,
    CASE WHEN _total_pool > 0 THEN ROUND((_pool_sim / _total_pool) * 100, 2) ELSE 0 END,
    CASE WHEN _total_pool > 0 THEN ROUND((_pool_nao / _total_pool) * 100, 2) ELSE 0 END,
    ROUND(_fee_percent * LEAST(_pool_sim, _pool_nao), 2);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_market_stats(target_market_id text)
RETURNS TABLE(vol_total numeric, vol_24h numeric, participantes integer)
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

CREATE OR REPLACE FUNCTION public.increment_balance(user_id uuid, amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;