import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FastPool {
  id: string;
  round_number: number;
  category: string;
  asset_symbol: string;
  asset_name: string;
  question: string;
  opening_price: number;
  closing_price?: number;
  round_start_time: string;
  round_end_time: string;
  status: 'active' | 'completed' | 'processing';
  result?: 'subiu' | 'desceu' | 'manteve';
  base_odds: number;
  created_at: string;
  updated_at: string;
}

export interface FastPoolsResponse {
  success: boolean;
  pools: FastPool[];
  current_round: number;
  seconds_remaining: number;
  round_start_time: string;
  round_end_time: string;
}

export interface FastBetResponse {
  success: boolean;
  bet_id: string;
  message: string;
  new_balance: number;
}

export interface FastResultsResponse {
  success: boolean;
  result: 'subiu' | 'desceu' | 'manteve';
  price_change_percent: number;
  opening_price: number;
  closing_price: number;
  winners_count: number;
  total_payout: number;
  total_bets: number;
}

export const useFastPools = (category: string) => {
  return useQuery({
    queryKey: ['fast-pools', category],
    queryFn: async (): Promise<FastPoolsResponse> => {
      const { data, error } = await supabase.functions.invoke('get-active-fast-pools', {
        body: { category }
      });

      if (error) {
        throw error;
      }

      return data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds to stay in sync
    staleTime: 1000,
    retry: 2,
  });
};

export const usePlaceFastBet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      pool_id, 
      side, 
      amount_rioz, 
      odds 
    }: {
      pool_id: string;
      side: 'subiu' | 'desceu';
      amount_rioz: number;
      odds: number;
    }): Promise<FastBetResponse> => {
      const { data, error } = await supabase.functions.invoke('place-fast-bet', {
        body: { pool_id, side, amount_rioz, odds }
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
  });
};

export const useProcessFastResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pool_id: string): Promise<FastResultsResponse> => {
      const { data, error } = await supabase.functions.invoke('process-fast-results', {
        body: { pool_id }
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['fast-pools'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
  });
};

export const useFastPoolHistory = (asset_symbol: string, limit = 10) => {
  return useQuery({
    queryKey: ['fast-pool-history', asset_symbol, limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-fast-pool-history', {
        body: { asset_symbol, limit }
      });

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!asset_symbol,
    staleTime: 30000, // Cache for 30 seconds
  });
};