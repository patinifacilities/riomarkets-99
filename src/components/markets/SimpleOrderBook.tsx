import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimpleOrderBookProps {
  marketId: string;
  simPercent: number;
  naoPercent: number;
  simOdds: number;
  naoOdds: number;
}

interface MarketOrder {
  id: string;
  side: 'sim' | 'nao';
  amount_rioz: number;
  probability_percent: number;
  odds: number;
  created_at: string;
}

const SimpleOrderBook = ({ marketId, simPercent, naoPercent, simOdds, naoOdds }: SimpleOrderBookProps) => {
  const [orders, setOrders] = useState<MarketOrder[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('market_orders')
        .select('*')
        .eq('market_id', marketId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setOrders(data as MarketOrder[]);
      }
    };

    fetchOrders();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`market_orders_${marketId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'market_orders',
          filter: `market_id=eq.${marketId}`
        }, 
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId]);

  const simOrders = orders.filter(order => order.side === 'sim');
  const naoOrders = orders.filter(order => order.side === 'nao');

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Order Book - Livro de Ordens
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Probabilidades atuais e ordens ativas
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SIM Orders */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#00FF91]" />
            <span className="font-semibold text-[#00FF91]">SIM ({simPercent.toFixed(1)}%) - {simOdds.toFixed(2)}x</span>
          </div>
          
          {simOrders.length > 0 ? (
            <div className="space-y-1">
              {simOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="p-2 rounded border border-[#00FF91]/20 bg-[#00FF91]/5 text-xs">
                  <div className="flex justify-between">
                    <span>{order.amount_rioz} RIOZ</span>
                    <span>{order.probability_percent.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
              {simOrders.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{simOrders.length - 3} mais ordens...
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded border border-[#00FF91]/20 bg-[#00FF91]/5">
              <div className="text-center text-[#00FF91] font-semibold">
                {simOdds.toFixed(2)}x odds - {simPercent.toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        {/* Market Separator */}
        <div className="border-y border-border py-2 text-center">
          <div className="text-sm text-muted-foreground">
            Spread do mercado
          </div>
        </div>

        {/* NÃO Orders */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-[#FF1493]" />
            <span className="font-semibold text-[#FF1493]">NÃO ({naoPercent.toFixed(1)}%) - {naoOdds.toFixed(2)}x</span>
          </div>
          
          {naoOrders.length > 0 ? (
            <div className="space-y-1">
              {naoOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="p-2 rounded border border-[#FF1493]/20 bg-[#FF1493]/5 text-xs">
                  <div className="flex justify-between">
                    <span>{order.amount_rioz} RIOZ</span>
                    <span>{order.probability_percent.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
              {naoOrders.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{naoOrders.length - 3} mais ordens...
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded border border-[#FF1493]/20 bg-[#FF1493]/5">
              <div className="text-center text-[#FF1493] font-semibold">
                {naoOdds.toFixed(2)}x odds - {naoPercent.toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleOrderBook;