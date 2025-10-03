import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Market } from '@/types';
import { adaptMarketFromDB } from '@/lib/market-adapter';

export const useMarkets = (categoryId?: string) => {
  return useQuery({
    queryKey: ['markets', categoryId],
    queryFn: async (): Promise<Market[]> => {
      let query = supabase
        .from('markets')
        .select('*');

      // Always exclude deleted markets unless explicitly requested
      if (categoryId !== 'excluido') {
        query = query.neq('status', 'excluido');
      }

      if (categoryId && categoryId !== 'all' && categoryId !== 'excluido') {
        query = query.eq('categoria', categoryId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(market => adaptMarketFromDB(market)) as Market[];
    },
    refetchInterval: 2000, // Auto-refresh every 2 seconds for real-time updates
  });
};

export const useMarket = (id: string) => {
  return useQuery({
    queryKey: ['market', id],
    queryFn: async (): Promise<Market | null> => {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return adaptMarketFromDB(data) as Market;
    },
    enabled: !!id,
  });
};