import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
  ordersCount: number;
}

interface FunctionalOrderBookProps {
  className?: string;
}

export const FunctionalOrderBook: React.FC<FunctionalOrderBookProps> = ({ className }) => {
  // Mock data for orderbook - no user names, just amounts and percentages
  const buyOrders: OrderBookLevel[] = [
    { price: 5.48, quantity: 1500, total: 8220, ordersCount: 3 },
    { price: 5.47, quantity: 2200, total: 12034, ordersCount: 5 },
    { price: 5.46, quantity: 1800, total: 9828, ordersCount: 2 },
    { price: 5.45, quantity: 3200, total: 17440, ordersCount: 7 },
    { price: 5.44, quantity: 1200, total: 6528, ordersCount: 2 },
  ];

  const sellOrders: OrderBookLevel[] = [
    { price: 5.52, quantity: 1100, total: 6072, ordersCount: 2 },
    { price: 5.53, quantity: 1800, total: 9954, ordersCount: 4 },
    { price: 5.54, quantity: 2100, total: 11634, ordersCount: 3 },
    { price: 5.55, quantity: 1600, total: 8880, ordersCount: 6 },
    { price: 5.56, quantity: 2400, total: 13344, ordersCount: 5 },
  ];

  const currentPrice = 5.50;
  const spread = sellOrders[0]?.price - buyOrders[0]?.price || 0;
  const spreadPercent = ((spread / currentPrice) * 100) || 0;

  return (
    <Card className={`bg-gradient-card border-border/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Order Book - RIOZ/BRL
        </CardTitle>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Preço atual: R$ {currentPrice.toFixed(2)}</span>
          <span>Spread: {spread.toFixed(3)} ({spreadPercent.toFixed(2)}%)</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sell Orders */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowUp className="w-4 h-4 text-red-400" />
            <h4 className="font-semibold text-red-400">Vendas</h4>
            <Badge variant="outline" className="border-red-400/30 text-red-400">
              {sellOrders.length}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground mb-1 px-2">
              <span>Preço (R$)</span>
              <span className="text-right">Qtd (RZ)</span>
              <span className="text-right">Total (R$)</span>
              <span className="text-right">Ordens</span>
            </div>
            
            {sellOrders.reverse().map((order, index) => (
              <div 
                key={index}
                className="grid grid-cols-4 gap-2 p-2 rounded hover:bg-red-500/5 border border-red-500/10 transition-colors"
              >
                <span className="text-sm font-mono text-red-400">{order.price.toFixed(2)}</span>
                <span className="text-sm font-mono text-right">{order.quantity.toLocaleString()}</span>
                <span className="text-sm font-mono text-right">{order.total.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground text-right">{order.ordersCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Price Indicator */}
        <div className="border-y border-border py-3 text-center">
          <div className="text-lg font-bold text-primary">
            R$ {currentPrice.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">
            Último preço negociado
          </div>
        </div>

        {/* Buy Orders */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowDown className="w-4 h-4 text-green-400" />
            <h4 className="font-semibold text-green-400">Compras</h4>
            <Badge variant="outline" className="border-green-400/30 text-green-400">
              {buyOrders.length}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground mb-1 px-2">
              <span>Preço (R$)</span>
              <span className="text-right">Qtd (RZ)</span>
              <span className="text-right">Total (R$)</span>
              <span className="text-right">Ordens</span>
            </div>
            
            {buyOrders.map((order, index) => (
              <div 
                key={index}
                className="grid grid-cols-4 gap-2 p-2 rounded hover:bg-green-500/5 border border-green-500/10 transition-colors"
              >
                <span className="text-sm font-mono text-green-400">{order.price.toFixed(2)}</span>
                <span className="text-sm font-mono text-right">{order.quantity.toLocaleString()}</span>
                <span className="text-sm font-mono text-right">{order.total.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground text-right">{order.ordersCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Market Depth Summary */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Profundidade:</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-2 rounded bg-green-500/10">
              <div className="text-xs text-muted-foreground">Vol. Compra</div>
              <div className="font-semibold text-green-400">
                {buyOrders.reduce((sum, order) => sum + order.quantity, 0).toLocaleString()} RZ
              </div>
            </div>
            <div className="text-center p-2 rounded bg-red-500/10">
              <div className="text-xs text-muted-foreground">Vol. Venda</div>
              <div className="font-semibold text-red-400">
                {sellOrders.reduce((sum, order) => sum + order.quantity, 0).toLocaleString()} RZ
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
            Atualizar Book
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};