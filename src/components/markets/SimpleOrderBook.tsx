import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrderBookEntry {
  id: string;
  user_id: string;
  side: string;
  quantity: number;
  price: number;
  created_at: string;
}

interface SimpleOrderBookProps {
  marketId: string;
  simPercent: number;
  naoPercent: number;
  simOdds: number;
  naoOdds: number;
}

const SimpleOrderBook = ({ marketId, simPercent, naoPercent, simOdds, naoOdds }: SimpleOrderBookProps) => {
  const [orders, setOrders] = useState<OrderBookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderBook();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`orderbook_${marketId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'market_order_book_pools',
          filter: `market_id=eq.${marketId}`
        },
        () => {
          fetchOrderBook();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId]);

  const fetchOrderBook = async () => {
    try {
      const { data, error } = await supabase
        .from('market_order_book_pools')
        .select('*')
        .eq('market_id', marketId)
        .eq('status', 'filled')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching order book:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Order Book
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Opiniões registradas no pool
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma opinião registrada ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    order.side === 'sim' ? 'bg-[#00ff90]' : 'bg-[#ff2389]'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      {order.side === 'sim' ? (
                        <TrendingUp className="w-4 h-4 text-[#00ff90]" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-[#ff2389]" />
                      )}
                      <span className={`font-medium ${
                        order.side === 'sim' ? 'text-[#00ff90]' : 'text-[#ff2389]'
                      }`}>
                        {order.side.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {order.user_id.slice(0, 8)}***
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold">{order.quantity.toLocaleString()} RZ</div>
                  <div className="text-sm text-muted-foreground">
                    {order.price.toFixed(2)}x • {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleOrderBook;