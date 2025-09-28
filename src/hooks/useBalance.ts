import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface UserBalance {
  rioz_balance: number;
  brl_balance: number;
  updated_at: string;
}

export const useBalance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: async (): Promise<UserBalance> => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('balances')
        .select('rioz_balance, brl_balance, updated_at')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        // If balance doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: newBalance, error: createError } = await supabase
            .from('balances')
            .insert({
              user_id: user.id,
              rioz_balance: 0,
              brl_balance: 0
            })
            .select()
            .single();
            
          if (createError) throw createError;
          
          return {
            rioz_balance: 0,
            brl_balance: 0,
            updated_at: newBalance.updated_at
          };
        }
        throw error;
      }
      
      return {
        rioz_balance: parseFloat(String(data.rioz_balance)),
        brl_balance: parseFloat(String(data.brl_balance)),
        updated_at: data.updated_at
      };
    },
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds to keep balance updated
  });

  // Listen for balance updates
  useEffect(() => {
    const handleBalanceUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['balance', user?.id] });
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    return () => window.removeEventListener('balanceUpdated', handleBalanceUpdate);
  }, [queryClient, user?.id]);

  return {
    ...query,
    riozBalance: query.data?.rioz_balance || 0,
    brlBalance: query.data?.brl_balance || 0,
  };
};