import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface OpenOpinionsCardDetailProps {
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

export const OpenOpinionsCardDetail: React.FC<OpenOpinionsCardDetailProps> = ({
  marketId,
  onOrderCancelled
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchOpenOrders = async () => {
    if (!user || !marketId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .eq('status', 'ativa')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenOrders();
  }, [user, marketId]);

  const handleCancelOrder = async (orderId: string, orderAmount: number) => {
    if (!user) return;

    try {
      // Call the cancel bet function with 30% fee
      const { data, error } = await supabase.rpc('cancel_bet_with_fee', {
        p_order_id: orderId,
        p_user_id: user.id
      });

      if (error) {
        throw error;
      }

      if (data && data.length > 0 && data[0].success) {
        const result = data[0];
        toast({
          title: "Opinião cancelada",
          description: `Reembolso: ${result.refund_amount} RZ (Taxa: ${result.fee_amount} RZ - 30%)`,
        });
        
        fetchOpenOrders();
        onOrderCancelled?.();
      } else {
        throw new Error(data?.[0]?.message || 'Erro ao cancelar opinião');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar a opinião. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return null;
  }

  return (
    <Card className="border border-primary/20 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          Suas Opiniões Abertas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={order.opcao_escolhida === 'sim' ? 'default' : 'destructive'}
                  className={
                    order.opcao_escolhida === 'sim'
                      ? 'bg-success text-black'
                      : 'bg-danger text-white'
                  }
                >
                  {order.opcao_escolhida === 'sim' ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {order.opcao_escolhida.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor opiniado:</span>
                <span className="font-medium">{order.quantidade_moeda} RZ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Odd na entrada:</span>
                <span className="font-medium">{order.preco.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Retorno potencial:</span>
                <span className="font-medium text-success">
                  {(order.quantidade_moeda * order.preco).toFixed(0)} RZ
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="flex-1 opacity-50"
              >
                Sacar agora
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Opinião</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar esta opinião? 
                      <br />
                      <br />
                      <strong>Taxa de cancelamento: 30%</strong>
                      <br />
                      Valor original: {order.quantidade_moeda} RZ
                      <br />
                      Taxa (30%): {(order.quantidade_moeda * 0.3).toFixed(0)} RZ
                      <br />
                      <strong>Você receberá: {(order.quantidade_moeda * 0.7).toFixed(0)} RZ</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Manter opinião</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancelOrder(order.id, order.quantidade_moeda)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancelar opinião
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};