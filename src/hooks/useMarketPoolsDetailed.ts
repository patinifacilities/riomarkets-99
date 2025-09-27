import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Market } from '@/types';

interface OptionData {
  label: string;
  chance: number;
  pool: number;
  bettors: number;
  isWinning?: boolean;
}

interface DetailedMarketPool {
  marketId: string;
  totalPool: number;
  totalBettors: number;
  options: OptionData[];
}

export const useMarketPoolsDetailed = (
  markets: Market[],
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    retry?: boolean;
    retryDelay?: number;
    staleTime?: number;
  } = {}
) => {
  return useQuery({
    queryKey: ['market-pools-detailed', markets.map(m => m.id)],
    queryFn: async (): Promise<Record<string, DetailedMarketPool>> => {
      if (!markets || markets.length === 0) return {};

      const marketIds = markets.map(m => m.id);

      // Get all active orders for these markets (exclude cashouts)
      const { data: orders, error } = await supabase
        .from('orders')
        .select('market_id, opcao_escolhida, quantidade_moeda, user_id')
        .in('market_id', marketIds)
        .eq('status', 'ativa');

      if (error) throw error;

      const pools: Record<string, DetailedMarketPool> = {};

      // Initialize pools for all markets
      markets.forEach(market => {
        const options: OptionData[] = market.opcoes.map(opcao => ({
          label: opcao,
          chance: 0,
          pool: 0,
          bettors: 0
        }));

        pools[market.id] = {
          marketId: market.id,
          totalPool: 0,
          totalBettors: 0,
          options
        };
      });

      // Calculate pools from orders
      orders?.forEach(order => {
        const pool = pools[order.market_id];
        if (!pool) return;

        const option = pool.options.find(opt => opt.label === order.opcao_escolhida);
        if (option) {
          option.pool += order.quantidade_moeda;
          // Count unique bettors per option
          const existingBettors = new Set();
          orders
            .filter(o => o.market_id === order.market_id && o.opcao_escolhida === order.opcao_escolhida)
            .forEach(o => existingBettors.add(o.user_id));
          option.bettors = existingBettors.size;
        }
      });

      // Calculate percentages and totals
      Object.values(pools).forEach(pool => {
        pool.totalPool = pool.options.reduce((sum, opt) => sum + opt.pool, 0);
        
        // Count total unique bettors
        const allBettors = new Set();
        orders
          ?.filter(o => o.market_id === pool.marketId)
          .forEach(o => allBettors.add(o.user_id));
        pool.totalBettors = allBettors.size;

        // Calculate chances
        pool.options.forEach(option => {
          if (pool.totalPool > 0) {
            option.chance = (option.pool / pool.totalPool) * 100;
          } else {
            option.chance = 0;
          }
        });
      });

      return pools;
    },
    enabled: options.enabled ?? (!!markets && markets.length > 0),
    refetchInterval: options.refetchInterval ?? 30000,
    retry: options.retry ?? false,
    retryDelay: options.retryDelay ?? 1000,
    staleTime: options.staleTime ?? 25000,
  });
};

export const useMarketPoolDetailed = (market: Market | null) => {
  const { data: pools } = useMarketPoolsDetailed(market ? [market] : []);
  return market ? pools?.[market.id] : undefined;
};