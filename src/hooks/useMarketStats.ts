import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarketStats {
  vol_total: number;
  vol_24h: number;
  participantes: number;
}

export const useMarketStats = (marketId: string) => {
  return useQuery({
    queryKey: ['market-stats', marketId],
    queryFn: async (): Promise<MarketStats> => {
      if (!marketId) {
        return {
          vol_total: 0,
          vol_24h: 0,
          participantes: 0,
        };
      }

      const { data, error } = await supabase
        .rpc('get_market_stats', { target_market_id: marketId });

      if (error) {
        console.error('Erro ao buscar stats do mercado:', error);
        return {
          vol_total: 0,
          vol_24h: 0,
          participantes: 0,
        };
      }

      if (!data || data.length === 0) {
        return {
          vol_total: 0,
          vol_24h: 0,
          participantes: 0,
        };
      }

      const statsData = data[0];
      return {
        vol_total: Number(statsData.vol_total) || 0,
        vol_24h: Number(statsData.vol_24h) || 0,
        participantes: Number(statsData.participantes) || 0,
      };
    },
    enabled: !!marketId,
    refetchInterval: 60000, // Atualiza a cada 1 minuto
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};