import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserOrders } from '@/hooks/useWallet';
import { useMarkets } from '@/hooks/useMarkets';

export const ExpandableCompletedOrdersCard = () => {
  const { user } = useAuth();
  const { data: orders, isLoading } = useUserOrders(user?.id);
  const { data: markets } = useMarkets();
  const [expanded, setExpanded] = useState(false);

  const completedOrders = orders?.filter(o => 
    o.status === 'ganha' || o.status === 'perdida'
  ).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) || [];

  const displayedOrders = expanded ? completedOrders : completedOrders.slice(0, 5);

  return (
    <Card className="bg-secondary-glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Opiniões Concluídas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        ) : completedOrders.length > 0 ? (
          <>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {displayedOrders.map((order) => {
                const market = markets?.find(m => m.id === order.market_id);
                const isWin = order.status === 'ganha';
                
                return (
                  <div
                    key={order.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isWin 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-red-500/30 bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-1 mb-1">
                          {market?.titulo || 'Mercado não encontrado'}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={isWin ? "default" : "destructive"} className="text-xs">
                            {isWin ? 'Ganhou' : 'Perdeu'}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {order.opcao_escolhida === 'sim' ? (
                              <TrendingUp className="w-3 h-3 text-green-500" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            )}
                            <span className="text-xs text-muted-foreground uppercase">
                              {order.opcao_escolhida}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-3">
                        <div className={`text-sm font-bold ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                          {isWin ? '+' : '-'}{order.quantidade_moeda} RZ
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{(order.preco || 1).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {completedOrders.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-3"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Ver mais ({completedOrders.length - 5})
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma opinião concluída</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
