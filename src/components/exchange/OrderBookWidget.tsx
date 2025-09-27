import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrderBookLevel {
  price: number;
  quantity: number;
  total_value: number;
  orders_count: number;
  side: 'buy' | 'sell';
}

export const OrderBookWidget = () => {
  const [levels, setLevels] = useState<OrderBookLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderbook = async () => {
      try {
        const { data, error } = await supabase
          .from('orderbook_levels')
          .select('*')
          .eq('symbol', 'RIOZBRL')
          .order('price', { ascending: false });

        if (error) throw error;
        setLevels((data || []) as OrderBookLevel[]);
      } catch (error) {
        console.error('Error fetching orderbook:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderbook();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('orderbook_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orderbook_levels' },
        () => {
          fetchOrderbook();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const buyOrders = levels.filter(l => l.side === 'buy').slice(0, 10);
  const sellOrders = levels.filter(l => l.side === 'sell').slice(0, 10);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Order Book RIOZ/BRL
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs text-muted-foreground border-b">
            <div>Preço (BRL)</div>
            <div className="text-right">Qtd (RIOZ)</div>
            <div className="text-right">Total (BRL)</div>
          </div>

          {/* Sell Orders */}
          <div className="space-y-0.5">
            {sellOrders.slice().reverse().map((level, index) => (
              <div 
                key={`sell-${index}`}
                className="grid grid-cols-3 gap-2 px-4 py-1 text-xs hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <div className="text-red-600 font-mono">
                  {level.price.toFixed(4)}
                </div>
                <div className="text-right text-muted-foreground">
                  {level.quantity.toLocaleString()}
                </div>
                <div className="text-right text-muted-foreground">
                  {level.total_value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Spread */}
          <div className="py-2 px-4 bg-muted/30 border-y">
            <div className="text-center text-xs text-muted-foreground">
              Spread: R$ {buyOrders[0] && sellOrders[0] ? 
                (sellOrders[0].price - buyOrders[0].price).toFixed(4) : '0.0000'}
            </div>
          </div>

          {/* Buy Orders */}
          <div className="space-y-0.5">
            {buyOrders.map((level, index) => (
              <div 
                key={`buy-${index}`}
                className="grid grid-cols-3 gap-2 px-4 py-1 text-xs hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
              >
                <div className="text-green-600 font-mono">
                  {level.price.toFixed(4)}
                </div>
                <div className="text-right text-muted-foreground">
                  {level.quantity.toLocaleString()}
                </div>
                <div className="text-right text-muted-foreground">
                  {level.total_value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};