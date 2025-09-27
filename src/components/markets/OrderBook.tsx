import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, TrendingUp, Activity } from 'lucide-react';

interface OrderBookEntry {
  id: string;
  option: 'sim' | 'nao';
  amount: number;
  probability: number;
  timestamp: string;
  ordersCount: number;
}

interface OrderBookProps {
  marketId: string;
}

const OrderBook = ({ marketId }: OrderBookProps) => {
  // Mock order book data - no user names, professional orderbook style
  const orders: OrderBookEntry[] = [
    { id: '1', option: 'sim', amount: 1500, probability: 0.65, timestamp: '10:30', ordersCount: 3 },
    { id: '2', option: 'nao', amount: 2000, probability: 0.35, timestamp: '10:28', ordersCount: 5 },
    { id: '3', option: 'sim', amount: 800, probability: 0.68, timestamp: '10:25', ordersCount: 2 },
    { id: '4', option: 'nao', amount: 1200, probability: 0.32, timestamp: '10:22', ordersCount: 4 },
    { id: '5', option: 'sim', amount: 500, probability: 0.62, timestamp: '10:20', ordersCount: 1 },
    { id: '6', option: 'sim', amount: 2200, probability: 0.70, timestamp: '10:18', ordersCount: 6 },
    { id: '7', option: 'nao', amount: 1800, probability: 0.30, timestamp: '10:15', ordersCount: 3 },
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
          Profundidade do mercado para este evento
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SIM Orders (Sell side) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowUp className="w-4 h-4 text-[#00FF91]" />
            <h4 className="font-semibold text-[#00FF91]">SIM</h4>
            <Badge variant="outline" className="border-[#00FF91]/30 text-[#00FF91]">
              {simOrders.length}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-1 px-2">
              <span>Probabilidade</span>
              <span className="text-right">Tamanho (RZ)</span>
              <span className="text-right">Ordens</span>
            </div>
            
            {simOrders.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Nenhuma ordem SIM
              </div>
            ) : (
              simOrders.reverse().map((order) => (
                <div 
                  key={order.id}
                  className="grid grid-cols-3 gap-2 p-2 rounded hover:bg-[#00FF91]/5 border border-[#00FF91]/10 transition-colors"
                >
                  <span className="text-sm font-mono text-[#00FF91]">{(order.probability * 100).toFixed(0)}%</span>
                  <span className="text-sm font-mono text-right">{order.amount.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground text-right">{order.ordersCount}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Market Separator */}
        <div className="border-y border-border py-2 text-center">
          <div className="text-sm text-muted-foreground">
            Spread do mercado
          </div>
        </div>

        {/* NÃO Orders (Buy side) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowDown className="w-4 h-4 text-[#FF1493]" />
            <h4 className="font-semibold text-[#FF1493]">NÃO</h4>
            <Badge variant="outline" className="border-[#FF1493]/30 text-[#FF1493]">
              {naoOrders.length}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-1 px-2">
              <span>Probabilidade</span>
              <span className="text-right">Tamanho (RZ)</span>
              <span className="text-right">Ordens</span>
            </div>
            
            {naoOrders.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Nenhuma ordem NÃO
              </div>
            ) : (
              naoOrders.map((order) => (
                <div 
                  key={order.id}
                  className="grid grid-cols-3 gap-2 p-2 rounded hover:bg-[#FF1493]/5 border border-[#FF1493]/10 transition-colors"
                >
                  <span className="text-sm font-mono text-[#FF1493]">{(order.probability * 100).toFixed(0)}%</span>
                  <span className="text-sm font-mono text-right">{order.amount.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground text-right">{order.ordersCount}</span>
                </div>
              ))
            )}
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