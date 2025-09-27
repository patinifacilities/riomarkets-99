import { useEffect } from 'react';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { ExchangeService } from '@/services/exchange';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const RatesTicker = () => {
  const { rate, rateLoading, fetchRate } = useExchangeStore();

  useEffect(() => {
    // Fetch rate every 5 seconds as fallback to realtime
    const interval = setInterval(() => {
      fetchRate();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchRate]);

  if (rateLoading && !rate) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando cotação...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rate) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            Cotação indisponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = rate.change24h >= 0;
  const changeColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                RIOZ/BRL
              </span>
              {rateLoading && (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="text-xl font-bold tabular-nums">
              {ExchangeService.formatPrice(rate.price)}
            </div>
          </div>

          <div className="text-right space-y-1">
            <Badge 
              variant={isPositive ? "default" : "destructive"}
              className={`${changeColor} border-current`}
            >
              <TrendIcon className="h-3 w-3 mr-1" />
              {ExchangeService.formatPercentage(rate.change24h)}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(rate.updated_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};