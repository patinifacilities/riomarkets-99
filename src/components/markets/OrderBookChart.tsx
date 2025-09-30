import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketPoolDetailed } from '@/hooks/useMarketPoolsDetailed';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Market } from '@/types';

interface OrderBookChartProps {
  market: Market;
}

export const OrderBookChart = ({ market }: OrderBookChartProps) => {
  const marketPool = useMarketPoolDetailed(market);
  const queryClient = useQueryClient();

  // Set up real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel(`market_orderbook_${market.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_order_book_pools',
          filter: `market_id=eq.${market.id}`
        },
        () => {
          console.log('Order book updated, refreshing...');
          // Invalidate and refetch market pools
          queryClient.invalidateQueries({ queryKey: ['market-pools'] });
          queryClient.invalidateQueries({ queryKey: ['market-pool', market.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [market.id, queryClient]);

  // Get aggregated data for SIM and NÃO - check all options
  console.log('Market pool options:', marketPool?.options);
  
  const simData = marketPool?.options.find(opt => {
    const label = opt.label.toLowerCase();
    return label.includes('sim') || label.includes('yes') || label === 'sim';
  });
  
  const naoData = marketPool?.options.find(opt => {
    const label = opt.label.toLowerCase();
    return label.includes('não') || label.includes('nao') || label.includes('no') || label === 'não' || label === 'nao';
  });

  const simTotal = simData?.pool || 0;
  const naoTotal = naoData?.pool || 0;
  const totalPool = simTotal + naoTotal;

  const simPercent = totalPool > 0 ? (simTotal / totalPool) * 100 : 50;
  const naoPercent = totalPool > 0 ? (naoTotal / totalPool) * 100 : 50;

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Agregação do Order Book
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Volume total por opinião
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Chart */}
        <div className="relative h-20 bg-muted/20 rounded-lg overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-[#00FF91] transition-all duration-500 flex items-center justify-center"
            style={{ width: `${simPercent}%` }}
          >
            {simPercent > 20 && (
              <span className="text-xs font-semibold text-black">
                SIM {simPercent.toFixed(0)}%
              </span>
            )}
          </div>
          <div 
            className="absolute right-0 top-0 h-full bg-[#FF1493] transition-all duration-500 flex items-center justify-center"
            style={{ width: `${naoPercent}%` }}
          >
            {naoPercent > 20 && (
              <span className="text-xs font-semibold text-white">
                NÃO {naoPercent.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-[#00FF91]/10 border border-[#00FF91]/20">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingUp className="w-4 h-4 text-[#00FF91]" />
              <span className="text-sm font-semibold text-[#00FF91]">SIM</span>
            </div>
            <div className="text-2xl font-bold text-[#00FF91] mb-1">
              {simTotal.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              RIOZ investidos
            </div>
            <div className="text-xs text-[#00FF91] mt-1">
              {simData?.bettors || 0} opiniões
            </div>
          </div>

          <div className="text-center p-3 rounded-lg bg-[#FF1493]/10 border border-[#FF1493]/20">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingDown className="w-4 h-4 text-[#FF1493]" />
              <span className="text-sm font-semibold text-[#FF1493]">NÃO</span>
            </div>
            <div className="text-2xl font-bold text-[#FF1493] mb-1">
              {naoTotal.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              RIOZ investidos
            </div>
            <div className="text-xs text-[#FF1493] mt-1">
              {naoData?.bettors || 0} opiniões
            </div>
          </div>
        </div>

        {/* Total Pool Summary */}
        <div className="text-center p-3 bg-muted/10 rounded-lg border">
          <div className="text-sm text-muted-foreground mb-1">Pool Total</div>
          <div className="text-xl font-bold">
            {totalPool.toLocaleString()} RIOZ
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {(simData?.bettors || 0) + (naoData?.bettors || 0)} participantes total
          </div>
        </div>
      </CardContent>
    </Card>
  );
};