-- Fix ambiguous column reference in get_market_pools function
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