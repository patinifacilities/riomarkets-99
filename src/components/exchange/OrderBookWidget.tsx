import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrderBookStore, OrderBookLevel } from '@/stores/useOrderBookStore';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface OrderBookRowProps {
  level: OrderBookLevel;
  side: 'buy' | 'sell';
  maxQuantity: number;
  onClick?: (price: number) => void;
}

const OrderBookRow: React.FC<OrderBookRowProps> = ({ level, side, maxQuantity, onClick }) => {
  const depthPercent = (level.quantity / maxQuantity) * 100;
  
  return (
    <div 
      className={`relative flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer transition-colors hover:bg-muted/50 ${
        side === 'buy' ? 'hover:bg-green-500/10' : 'hover:bg-red-500/10'
      }`}
      onClick={() => onClick?.(level.price)}
      role="button"
      tabIndex={0}
      aria-label={`${side} order at ${formatCurrency(level.price, 'BRL')} for ${level.quantity.toLocaleString()} RIOZ`}
    >
      {/* Depth indicator */}
      <div 
        className={`absolute left-0 top-0 h-full opacity-20 ${
          side === 'buy' ? 'bg-green-500' : 'bg-red-500'
        }`}
        style={{ width: `${depthPercent}%` }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <span className={`font-mono font-medium ${
          side === 'buy' ? 'text-green-400' : 'text-red-400'
        }`}>
          {formatCurrency(level.price, 'BRL')}
        </span>
        <span className="text-muted-foreground font-mono">
          {level.quantity.toLocaleString()}
        </span>
        <span className="text-muted-foreground font-mono text-xs">
          {formatCurrency(level.total_value, 'BRL')}
        </span>
      </div>
    </div>
  );
};

const SpreadIndicator: React.FC<{ 
  bestAsk: number; 
  bestBid: number; 
  spread: number; 
  spreadPercent: number;
}> = ({ bestAsk, bestBid, spread, spreadPercent }) => (
  <div className="px-3 py-4 bg-muted/30 border-y">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <ArrowUp className="w-4 h-4 text-red-400" />
        <span className="text-red-400 font-mono text-sm">
          {formatCurrency(bestAsk, 'BRL')}
        </span>
        <Badge variant="secondary" className="text-xs">
          Melhor Venda
        </Badge>
      </div>
    </div>
    
    <div className="flex items-center justify-center py-2">
      <Badge variant="outline" className="text-xs">
        Spread: {formatCurrency(spread, 'BRL')} ({spreadPercent.toFixed(2)}%)
      </Badge>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ArrowDown className="w-4 h-4 text-green-400" />
        <span className="text-green-400 font-mono text-sm">
          {formatCurrency(bestBid, 'BRL')}
        </span>
        <Badge variant="secondary" className="text-xs">
          Melhor Compra
        </Badge>
      </div>
    </div>
  </div>
);

const OrderBookHeader: React.FC<{ lastPrice: number; priceChange?: number }> = ({ 
  lastPrice, 
  priceChange = 0 
}) => (
  <div className="flex items-center justify-between px-3 py-2 border-b">
    <div className="flex items-center gap-2">
      <span className="font-semibold">Order Book</span>
      <Badge variant="outline" className="text-xs">RIOZ/BRL</Badge>
    </div>
    <div className="flex items-center gap-2">
      {priceChange !== 0 && (
        priceChange > 0 ? (
          <TrendingUp className="w-4 h-4 text-green-400" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400" />
        )
      )}
      <span className={`font-mono font-bold ${
        priceChange > 0 ? 'text-green-400' : priceChange < 0 ? 'text-red-400' : 'text-foreground'
      }`}>
        {formatCurrency(lastPrice, 'BRL')}
      </span>
    </div>
  </div>
);

const TableHeader: React.FC = () => (
  <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/20">
    <span>Preço (BRL)</span>
    <span>Quantidade (RIOZ)</span>
    <span>Total (BRL)</span>
  </div>
);

export const OrderBookWidget: React.FC<{ 
  onPriceClick?: (price: number) => void;
  compact?: boolean;
}> = ({ onPriceClick, compact = false }) => {
  const {
    orderBookData,
    orderBookLoading,
    orderBookError,
    maxLevels,
    startRealTimeUpdates
  } = useOrderBookStore();

  // Start real-time updates on mount
  useEffect(() => {
    const cleanup = startRealTimeUpdates();
    return cleanup;
  }, [startRealTimeUpdates]);

  // Calculate max quantity for depth visualization
  const maxQuantity = useMemo(() => {
    if (!orderBookData) return 0;
    const allLevels = [...orderBookData.bids, ...orderBookData.asks];
    return Math.max(...allLevels.map(level => level.quantity));
  }, [orderBookData]);

  // Limit levels displayed
  const displayBids = useMemo(() => 
    orderBookData?.bids.slice(0, maxLevels) || [], 
    [orderBookData?.bids, maxLevels]
  );
  
  const displayAsks = useMemo(() => 
    orderBookData?.asks.slice(0, maxLevels) || [], 
    [orderBookData?.asks, maxLevels]
  );

  if (orderBookLoading && !orderBookData) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Order Book</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (orderBookError) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg text-red-400">Erro no Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{orderBookError}</p>
        </CardContent>
      </Card>
    );
  }

  if (!orderBookData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-0">
        <OrderBookHeader 
          lastPrice={orderBookData.last_price}
        />
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <TableHeader />
        
        {/* Asks (Sell orders) - displayed in reverse order (lowest first) */}
        <div className="max-h-64 overflow-y-auto">
          {displayAsks.reverse().map((level, index) => (
            <OrderBookRow
              key={`ask-${level.price}-${index}`}
              level={level}
              side="sell"
              maxQuantity={maxQuantity}
              onClick={onPriceClick}
            />
          ))}
        </div>
        
        {/* Spread indicator */}
        <SpreadIndicator
          bestAsk={orderBookData.best_ask}
          bestBid={orderBookData.best_bid}
          spread={orderBookData.spread}
          spreadPercent={orderBookData.spread_percent}
        />
        
        {/* Bids (Buy orders) */}
        <div className="max-h-64 overflow-y-auto">
          {displayBids.map((level, index) => (
            <OrderBookRow
              key={`bid-${level.price}-${index}`}
              level={level}
              side="buy"
              maxQuantity={maxQuantity}
              onClick={onPriceClick}
            />
          ))}
        </div>
        
        {/* Footer info */}
        <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/10">
          <div className="flex justify-between items-center">
            <span>Última atualização: {new Date(orderBookData.last_updated).toLocaleTimeString()}</span>
            <Badge variant="outline" className="text-xs">
              {displayBids.length + displayAsks.length} níveis
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};