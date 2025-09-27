-- Fase 1: Correções de Dados e Schema

-- Adicionar foreign key para market_id em wallet_transactions
ALTER TABLE public.wallet_transactions 
ADD COLUMN market_id text;

-- Atualizar profiles trigger para incluir saldo inicial
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

-- Função para fechar mercados automaticamente
CREATE OR REPLACE FUNCTION public.close_expired_markets()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.markets 
  SET status = 'fechado'
  WHERE status = 'aberto' 
    AND end_date < now();
END;
$function$;

-- Função para calcular pools de mercados
CREATE OR REPLACE FUNCTION public.get_market_pools(market_id text)
RETURNS table(
  pool_sim numeric,
  pool_nao numeric,
  total_pool numeric,
  percent_sim numeric,
  percent_nao numeric,
  projected_fee numeric
) 
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  _pool_sim numeric := 0;
  _pool_nao numeric := 0;
  _total_pool numeric := 0;
  _fee_percent numeric := 0.20;
BEGIN
  -- Calcular pool Sim
  SELECT COALESCE(SUM(quantidade_moeda), 0) INTO _pool_sim
  FROM public.orders
  WHERE market_id = get_market_pools.market_id
    AND opcao_escolhida = 'sim'
    AND status = 'ativa';
    
  -- Calcular pool Não
  SELECT COALESCE(SUM(quantidade_moeda), 0) INTO _pool_nao
  FROM public.orders
  WHERE market_id = get_market_pools.market_id
    AND opcao_escolhida = 'nao'
    AND status = 'ativa';
    
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

-- Criar configuração de fee se não existir
INSERT INTO public.settings (fee_percent) 
VALUES (0.20)
ON CONFLICT DO NOTHING;