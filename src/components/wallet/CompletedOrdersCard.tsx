import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserOrders } from '@/hooks/useWallet';
import { useMarkets } from '@/hooks/useMarkets';

export const CompletedOrdersCard = () => {
  const { user } = useAuth();
  const { data: orders, isLoading: loadingOrders } = useUserOrders(user?.id);
  const { data: markets } = useMarkets();

  // Filter only completed orders (ganha, perdida, cancelada)
  const completedOrders = orders?.filter(o => 
    o.status !== 'ativa'
  ).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) || [];

  return (
    <Card className="bg-secondary-glass border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Opiniões Concluídas</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loadingOrders ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        ) : completedOrders && completedOrders.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {completedOrders.map((order) => {
              const market = markets?.find(m => m.id === order.market_id);
              
              return (
                <div 
                  key={order.id} 
                  className="p-4 rounded-lg border border-border/50 hover:border-border/70 transition-all cursor-pointer"
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
                            <Badge variant="secondary" className="text-xs">
                              {order.status === 'ganha' ? 'Ganha' : 
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
            <p>Nenhuma opinião concluída</p>
            <p className="text-sm mt-1">Suas opiniões concluídas aparecerão aqui</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
