import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, TrendingUp, Activity } from 'lucide-react';

interface OrderBookEntry {
  id: string;
  user: string;
  option: 'sim' | 'nao';
  amount: number;
  probability: number;
  timestamp: string;
}

interface OrderBookProps {
  marketId: string;
}

const OrderBook = ({ marketId }: OrderBookProps) => {
  // Mock order book data - replace with real API call
  const orders: OrderBookEntry[] = [
    { id: '1', user: 'Analista123', option: 'sim', amount: 1500, probability: 0.65, timestamp: '10:30' },
    { id: '2', user: 'TradePro', option: 'nao', amount: 2000, probability: 0.35, timestamp: '10:28' },
    { id: '3', user: 'SmartBet', option: 'sim', amount: 800, probability: 0.68, timestamp: '10:25' },
    { id: '4', user: 'MarketGuru', option: 'nao', amount: 1200, probability: 0.32, timestamp: '10:22' },
    { id: '5', user: 'DataAnalyst', option: 'sim', amount: 500, probability: 0.62, timestamp: '10:20' },
  ];

  const simOrders = orders.filter(order => order.option === 'sim').slice(0, 5);
  const naoOrders = orders.filter(order => order.option === 'nao').slice(0, 5);

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Order Book - Mercado de Opiniões
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ordens de outros usuários aguardando para serem preenchidas
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SIM Orders */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ArrowUp className="w-4 h-4 text-[#00FF91]" />
              <h4 className="font-semibold text-[#00FF91]">Ordens SIM</h4>
              <Badge variant="outline" className="border-[#00FF91]/30 text-[#00FF91]">
                {simOrders.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {simOrders.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Nenhuma ordem SIM pendente
                </div>
              ) : (
                simOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="p-3 rounded-lg border border-[#00FF91]/20 bg-[#00FF91]/5 hover:bg-[#00FF91]/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{order.user}</span>
                      <span className="text-xs text-muted-foreground">{order.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">{order.amount.toLocaleString()} RZ</span>
                      <span className="text-xs text-[#00FF91]">
                        {(order.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* NÃO Orders */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ArrowDown className="w-4 h-4 text-[#FF1493]" />
              <h4 className="font-semibold text-[#FF1493]">Ordens NÃO</h4>
              <Badge variant="outline" className="border-[#FF1493]/30 text-[#FF1493]">
                {naoOrders.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {naoOrders.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Nenhuma ordem NÃO pendente
                </div>
              ) : (
                naoOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="p-3 rounded-lg border border-[#FF1493]/20 bg-[#FF1493]/5 hover:bg-[#FF1493]/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{order.user}</span>
                      <span className="text-xs text-muted-foreground">{order.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">{order.amount.toLocaleString()} RZ</span>
                      <span className="text-xs text-[#FF1493]">
                        {(order.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Market Depth Summary */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Liquidez Total:</span>
            </div>
            <span className="font-semibold">
              {orders.reduce((sum, order) => sum + order.amount, 0).toLocaleString()} RZ
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="text-center p-2 rounded bg-[#00FF91]/10">
              <div className="text-xs text-muted-foreground">Volume SIM</div>
              <div className="font-semibold text-[#00FF91]">
                {simOrders.reduce((sum, order) => sum + order.amount, 0).toLocaleString()} RZ
              </div>
            </div>
            <div className="text-center p-2 rounded bg-[#FF1493]/10">
              <div className="text-xs text-muted-foreground">Volume NÃO</div>
              <div className="font-semibold text-[#FF1493]">
                {naoOrders.reduce((sum, order) => sum + order.amount, 0).toLocaleString()} RZ
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button 
            variant="outline" 
            size="sm"
            className="text-primary border-primary/30 hover:bg-primary/10"
          >
            Atualizar Order Book
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderBook;