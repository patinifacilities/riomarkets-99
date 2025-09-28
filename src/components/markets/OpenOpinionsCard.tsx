import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OpenOpinionsCardProps {
  marketId: string;
  onOrderCancelled?: () => void;
}

interface Order {
  id: string;
  opcao_escolhida: string;
  quantidade_moeda: number;
  preco: number;
  created_at: string;
}

export const OpenOpinionsCard = ({ marketId, onOrderCancelled }: OpenOpinionsCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's open orders for this market
  React.useEffect(() => {
    if (user?.id && marketId) {
      fetchOpenOrders();
    }
  }, [user?.id, marketId]);

  const fetchOpenOrders = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('market_order_book_pools')
        .select('*')
        .eq('market_id', marketId)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      
      // Map the data to match our Order interface
      const mappedOrders = (data || []).map(item => ({
        id: item.id,
        opcao_escolhida: item.side,
        quantidade_moeda: item.quantity,
        preco: item.price,
        created_at: item.created_at
      }));
      
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching open orders:', error);
    }
  };

  const handleCancelOrder = async (orderId: string, orderAmount: number) => {
    setLoading(true);
    try {
      // Cancel order and apply 30% fee
      const { error: updateError } = await supabase
        .from('market_order_book_pools')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Apply 30% cancellation fee
      const fee = orderAmount * 0.3;
      const refund = orderAmount - fee;

      // Insert refund transaction
      await supabase.from('wallet_transactions').insert({
        id: `cancel_${orderId}_${Date.now()}`,
        user_id: user?.id,
        tipo: 'credito',
        valor: Math.round(refund),
        descricao: `Reembolso de cancelamento - Taxa de 30% aplicada`
      });

      // Update user balance
      await supabase.rpc('increment_balance', {
        user_id: user?.id,
        amount: Math.round(refund)
      });

      toast({
        title: "Opinião cancelada",
        description: `Reembolso de ${refund.toFixed(0)} RIOZ (taxa de 30% aplicada)`,
      });

      fetchOpenOrders();
      onOrderCancelled?.();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Erro",
        description: "Falha ao cancelar opinião",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!orders.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Opinião em Aberto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="p-4 rounded-lg border border-border/50 bg-card/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      className={order.opcao_escolhida === 'sim' 
                        ? 'bg-[#00ff90] text-black' 
                        : 'bg-[#ff2389] text-white'
                      }
                    >
                      {order.opcao_escolhida.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {order.preco.toFixed(2)}x
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Quantidade: {order.quantidade_moeda.toLocaleString()} RIOZ
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-3">
                  <Button 
                    size="sm"
                    variant="outline"
                    className="border-danger/30 text-danger hover:bg-danger/10 text-xs px-2 py-1"
                    onClick={() => handleCancelOrder(order.id, order.quantidade_moeda)}
                    disabled={loading}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancelar
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="border-success/30 text-success hover:bg-success/10 text-xs px-2 py-1"
                    disabled
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    Sacar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};