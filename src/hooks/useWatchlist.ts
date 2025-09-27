import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface WatchlistItem {
  id: string;
  user_id: string;
  market_id: string;
  created_at: string;
}

export const useWatchlist = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async (): Promise<WatchlistItem[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar watchlist:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useToggleWatchlist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ marketId, isWatched }: { marketId: string; isWatched: boolean }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      if (isWatched) {
        // Remove from watchlist
        const { error } = await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('market_id', marketId);

        if (error) throw error;
      } else {
        // Add to watchlist
        const { error } = await supabase
          .from('user_watchlist')
          .insert({
            user_id: user.id,
            market_id: marketId,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, { isWatched }) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success(isWatched ? 'Removido da watchlist' : 'Adicionado à watchlist');
    },
    onError: (error) => {
      console.error('Erro ao alterar watchlist:', error);
      toast.error('Erro ao alterar watchlist');
    },
  });
};

export const useIsWatched = (marketId: string) => {
  const { data: watchlist = [] } = useWatchlist();
  return watchlist.some(item => item.market_id === marketId);
};