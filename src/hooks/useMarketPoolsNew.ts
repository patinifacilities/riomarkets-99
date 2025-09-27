import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarketPoolData {
  pool_sim: number;
  pool_nao: number;
  total_pool: number;
  percent_sim: number;
  percent_nao: number;
  projected_fee: number;
}

export const useMarketPool = (marketId: string) => {
  return useQuery({
    queryKey: ['market-pool', marketId],
    queryFn: async (): Promise<MarketPoolData> => {
      if (!marketId) {
        return {
          pool_sim: 0,
          pool_nao: 0,
          total_pool: 0,
          percent_sim: 0,
          percent_nao: 0,
          projected_fee: 0,
        };
      }

      const { data, error } = await supabase
        .rpc('get_market_pools', { market_id: marketId });

      if (error) {
        console.error('Erro ao buscar pools do mercado:', error);
        // Return default values instead of throwing error to prevent oscillation
        return {
          pool_sim: 0,
          pool_nao: 0,
          total_pool: 0,
          percent_sim: 0,
          percent_nao: 0,
          projected_fee: 0,
        };
      }

      if (!data || data.length === 0) {
        return {
          pool_sim: 0,
          pool_nao: 0,
          total_pool: 0,
          percent_sim: 0,
          percent_nao: 0,
          projected_fee: 0,
        };
      }

      const poolData = data[0];
      return {
        pool_sim: Number(poolData.pool_sim) || 0,
        pool_nao: Number(poolData.pool_nao) || 0,
        total_pool: Number(poolData.total_pool) || 0,
        percent_sim: Number(poolData.percent_sim) || 0,
        percent_nao: Number(poolData.percent_nao) || 0,
        projected_fee: Number(poolData.projected_fee) || 0,
      };
    },
    enabled: !!marketId,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    retry: 2, // Limit retries to prevent infinite loops
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 10000, // Consider data fresh for 10 seconds
  });
};