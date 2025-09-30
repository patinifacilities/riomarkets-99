import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown, X, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserOrders } from '@/hooks/useWallet';
import { useMarkets } from '@/hooks/useMarkets';
import CashoutModal from '@/components/wallet/CashoutModal';
import { CancelBetModal } from '@/components/wallet/CancelBetModal';

interface OrderHistoryCardProps {
  onRefresh?: () => void;
}

export const OrderHistoryCard = ({ onRefresh }: OrderHistoryCardProps) => {
  const { user } = useAuth();
  const { data: orders, isLoading: loadingOrders } = useUserOrders(user?.id);
  const { data: markets } = useMarkets();
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Sort orders: active first, then by date
  const allOrders = orders?.sort((a, b) => {
    // Active orders first
    if (a.status === 'ativa' && b.status !== 'ativa') return -1;
    if (b.status === 'ativa' && a.status !== 'ativa') return 1;
    
    // Then by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }) || [];

  const handleCashout = (order: any) => {
    setSelectedOrder(order);
    setShowCashoutModal(true);
  };

  const handleCancel = (order: any) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  return (
    <>
      <Card className="bg-secondary-glass border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Suas Opiniões Abertas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted/20 rounded animate-pulse" />
              ))}
            </div>
          ) : allOrders && allOrders.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {allOrders.map((order) => {
                const market = markets?.find(m => m.id === order.market_id);
                const isActive = order.status === 'ativa';
                
                return (
                  <div 
                    key={order.id} 
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      isActive 
                        ? 'border-primary/30 bg-primary/5 hover:border-primary/50' 
                        : 'border-border/50 hover:border-border/70'
                    }`}
                    onClick={() => market && (window.location.href = `/market/${market.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm line-clamp-2 mb-1">
                              {market?.titulo || 'Mercado não encontrado'}
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                                {order.status === 'ativa' ? 'Ativa' : 
                                 order.status === 'ganha' ? 'Ganha' : 
                                 order.status === 'perdida' ? 'Perdida' : 'Cancelada'}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {order.opcao_escolhida === 'sim' ? (
                                  <TrendingUp className="w-3 h-3 text-green-500" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-red-500" />
                                )}
                                <span className="text-xs text-muted-foreground uppercase font-medium">
                                  {order.opcao_escolhida}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right ml-3">
                            <div className="text-sm font-bold">
                              {order.quantidade_moeda.toLocaleString('pt-BR')} RZ
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @{(order.preco || 1).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          
                          {isActive && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-primary" />
                                <span className="text-primary font-medium">
                                  Retorno potencial: {(order.quantidade_moeda * (order.preco || 1)).toLocaleString('pt-BR')} RZ
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancel(order);
                                }}
                                className="text-xs px-2 py-1 h-6 bg-[#ff2389] hover:bg-[#ff2389]/90 text-white border-0"
                              >
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma opinião encontrada</p>
              <p className="text-sm mt-1">Suas opiniões aparecerão aqui</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedOrder && (
        <CashoutModal
          isOpen={showCashoutModal}
          onClose={() => {
            setShowCashoutModal(false);
            setSelectedOrder(null);
            onRefresh?.();
          }}
          order={selectedOrder}
        />
      )}

      <CancelBetModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        orderId={selectedOrder?.id}
        orderAmount={selectedOrder?.quantidade_moeda}
        onConfirm={() => {
          setShowCancelModal(false);
          setSelectedOrder(null);
          onRefresh?.();
        }}
      />
    </>
  );
};