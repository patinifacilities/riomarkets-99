import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrderBookStore } from '@/stores/useOrderBookStore';
import { ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export const OrderBookTicker: React.FC<{ className?: string }> = ({ className }) => {
  const {
    orderBookData,
    orderBookLoading,
    orderBookError,
    startRealTimeUpdates
  } = useOrderBookStore();

  // Start real-time updates on mount
  useEffect(() => {
    const cleanup = startRealTimeUpdates();
    return cleanup;
  }, [startRealTimeUpdates]);

  if (orderBookLoading && !orderBookData) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orderBookError || !orderBookData) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-muted-foreground">
            <Activity className="w-4 h-4 mr-2" />
            <span className="text-sm">Order Book indisponível</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Best Bid */}
          <div className="flex items-center gap-2">
            <ArrowDown className="w-4 h-4 text-green-400" />
            <div className="text-center">
              <div className="text-green-400 font-mono font-semibold">
                {formatCurrency(orderBookData.best_bid, 'BRL')}
              </div>
              <div className="text-xs text-muted-foreground">
                Melhor Compra
              </div>
            </div>
          </div>

          {/* Spread */}
          <div className="text-center">
            <Badge variant="outline" className="mb-1">
              {formatCurrency(orderBookData.spread, 'BRL')}
            </Badge>
            <div className="text-xs text-muted-foreground">
              Spread ({orderBookData.spread_percent.toFixed(2)}%)
            </div>
          </div>

          {/* Best Ask */}
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-red-400 font-mono font-semibold">
                {formatCurrency(orderBookData.best_ask, 'BRL')}
              </div>
              <div className="text-xs text-muted-foreground">
                Melhor Venda
              </div>
            </div>
            <ArrowUp className="w-4 h-4 text-red-400" />
          </div>
        </div>

        {/* Last Price */}
        <div className="mt-3 pt-3 border-t text-center">
          <div className="flex items-center justify-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-bold font-mono">
              {formatCurrency(orderBookData.last_price, 'BRL')}
            </span>
            <Badge variant="secondary" className="text-xs">
              Último Preço
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};