import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMarkets } from './useMarkets';

export interface MarketPool {
  marketId: string;
  totalSimCoins: number;
  totalNaoCoins: number;
  totalCoins: number;
  simPercentage: number;
  naoPercentage: number;
  simCount: number;
  naoCount: number;
}

export const useMarketPools = () => {
  const { data: markets } = useMarkets();

  return useQuery({
    queryKey: ['market-pools'],
    queryFn: async (): Promise<Record<string, MarketPool>> => {
      if (!markets || markets.length === 0) return {};

      const { data: orders, error } = await supabase
        .from('orders')
        .select('market_id, opcao_escolhida, quantidade_moeda')
        .eq('status', 'ativa');

      if (error) throw error;

      const pools: Record<string, MarketPool> = {};

      // Initialize pools for all markets
      markets.forEach(market => {
        pools[market.id] = {
          marketId: market.id,
          totalSimCoins: 0,
          totalNaoCoins: 0,
          totalCoins: 0,
          simPercentage: 50,
          naoPercentage: 50,
          simCount: 0,
          naoCount: 0,
        };
      });

      // Calculate pools from orders
      orders?.forEach(order => {
        if (!pools[order.market_id]) return;

        const pool = pools[order.market_id];
        
        if (order.opcao_escolhida === 'sim') {
          pool.totalSimCoins += order.quantidade_moeda;
          pool.simCount += 1;
        } else if (order.opcao_escolhida === 'não') {
          pool.totalNaoCoins += order.quantidade_moeda;
          pool.naoCount += 1;
        }
      });

      // Calculate percentages
      Object.values(pools).forEach(pool => {
        pool.totalCoins = pool.totalSimCoins + pool.totalNaoCoins;
        
        if (pool.totalCoins > 0) {
          pool.simPercentage = Math.round((pool.totalSimCoins / pool.totalCoins) * 100);
          pool.naoPercentage = Math.round((pool.totalNaoCoins / pool.totalCoins) * 100);
        }
      });

      return pools;
    },
    enabled: !!markets,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useMarketPool = (marketId: string) => {
  const { data: pools } = useMarketPools();
  
  return pools?.[marketId] || {
    marketId,
    totalSimCoins: 0,
    totalNaoCoins: 0,
    totalCoins: 0,
    simPercentage: 50,
    naoPercentage: 50,
    simCount: 0,
    naoCount: 0,
  };
};