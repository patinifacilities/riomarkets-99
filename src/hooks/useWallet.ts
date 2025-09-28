import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WalletTransaction, Order } from '@/types';

export const useWalletTransactions = (userId?: string) => {
  return useQuery({
    queryKey: ['wallet-transactions', userId],
    queryFn: async (): Promise<WalletTransaction[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as WalletTransaction[];
    },
    enabled: !!userId,
  });
};

export const useUserOrders = (userId?: string) => {
  return useQuery({
    queryKey: ['user-orders', userId],
    queryFn: async (): Promise<Order[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Order[];
    },
    enabled: !!userId,
    refetchInterval: 2000, // Refetch every 2 seconds to catch status changes
  });
};