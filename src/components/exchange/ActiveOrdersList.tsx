import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Clock, X, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useLimitOrderStore } from '@/stores/useLimitOrderStore';
import { LimitOrderService } from '@/services/limitOrders';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ActiveOrdersList: React.FC = () => {
  const {
    activeOrders,
    activeOrdersLoading,
    activeOrdersError,
    cancellingOrder,
    operationError,
    fetchActiveOrders,
    cancelOrder,
    subscribeToOrderUpdates,
    clearErrors
  } = useLimitOrderStore();
  
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveOrders();
    const unsubscribe = subscribeToOrderUpdates();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (operationError) {
      toast({
        title: 'Erro na Operação',
        description: operationError,
        variant: 'destructive',
      });
      clearErrors();
    }
  }, [operationError, toast, clearErrors]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      toast({
        title: 'Ordem Cancelada',
        description: 'Sua ordem limit foi cancelada com sucesso.',
      });
    } catch (error) {
      // Error is handled by the store and shown via useEffect above
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    try {
      return formatDistanceToNow(new Date(expiresAt), { locale: ptBR });
    } catch {
      return 'N/A';
    }
  };

  if (activeOrdersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ordens Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando ordens...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeOrdersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ordens Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{activeOrdersError}</p>
            <Button onClick={fetchActiveOrders} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Ordens Ativas ({activeOrders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeOrders.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Nenhuma ordem ativa</p>
            <p className="text-sm text-muted-foreground">
              Crie uma ordem limit para começar
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {activeOrders.map((order, index) => (
                <div key={order.id}>
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {order.side === 'buy_rioz' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">
                          {order.side === 'buy_rioz' ? 'Comprar' : 'Vender'} RIOZ
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Quantidade:</span>
                          <p className="font-medium">
                            {LimitOrderService.formatCurrency(order.amount_rioz, 'RIOZ')}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Preço Limite:</span>
                          <p className="font-medium">
                            {LimitOrderService.formatCurrency(order.limit_price, 'BRL')}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor Total:</span>
                          <p className="font-medium">
                            {LimitOrderService.formatCurrency(order.amount_brl, 'BRL')}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Taxa:</span>
                          <p className="font-medium">
                            {order.side === 'buy_rioz' 
                              ? LimitOrderService.formatCurrency(order.fee_rioz, 'RIOZ')
                              : LimitOrderService.formatCurrency(order.fee_brl, 'BRL')
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Criada: {formatDistanceToNow(new Date(order.created_at), { 
                            locale: ptBR, 
                            addSuffix: true 
                          })}
                        </span>
                        {order.expires_at && (
                          <span>
                            Expira em: {formatTimeRemaining(order.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={cancellingOrder === order.id}
                          >
                            {cancellingOrder === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar Ordem</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja cancelar esta ordem limit? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Manter Ordem</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelOrder(order.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Cancelar Ordem
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {index < activeOrders.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};