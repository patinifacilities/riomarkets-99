import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarketOptionReward {
  label: string;
  pool: number;
  percent: number;
  bettors: number;
  recompensa: number;
}

export interface MarketRewardsData {
  market_id: string;
  total_pool: number;
  fee_percent: number;
  options: MarketOptionReward[];
}

export const useMarketRewards = (marketId: string) => {
  return useQuery({
    queryKey: ['market-rewards', marketId],
    queryFn: async (): Promise<MarketRewardsData> => {
      if (!marketId) {
        return {
          market_id: '',
          total_pool: 0,
          fee_percent: 0.20,
          options: [],
        };
      }

      const { data, error } = await supabase.functions.invoke('calc-pools-with-rewards', {
        body: { market_id: marketId },
      });

      if (error) {
        console.error('Erro ao buscar recompensas do mercado:', error);
        throw error;
      }

      return data || {
        market_id: marketId,
        total_pool: 0,
        fee_percent: 0.20,
        options: [],
      };
    },
    enabled: !!marketId,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    retry: 2,
    retryDelay: 1000,
    staleTime: 10000,
  });
};