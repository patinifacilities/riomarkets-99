import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CashoutQuote {
  order_id: string;
  market_id: string;
  opcao_escolhida: string;
  quantidade_original: number;
  multiple_now: number;
  gross: number;
  fee: number;
  net: number;
  cashout_fee_percent: number;
}

export const useCashoutQuote = (orderId?: string) => {
  return useQuery({
    queryKey: ['cashout-quote', orderId],
    queryFn: async (): Promise<CashoutQuote> => {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const { data, error } = await supabase.functions.invoke('get-cashout-quote', {
        body: { order_id: orderId },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!orderId,
    refetchInterval: 15000, // Atualiza a cada 15 segundos (quotes mudam rapidamente)
    retry: 1,
    staleTime: 5000,
  });
};

export const usePerformCashout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('perform-cashout', {
        body: { 
          order_id: orderId,
          user_id: user.id 
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Cashout realizado!",
        description: `Você recebeu ${data.cashout_amount} Rioz Coin`,
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['market-rewards'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no cashout",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};