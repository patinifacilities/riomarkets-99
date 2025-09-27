import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMarkets } from '@/hooks/useMarkets';
import { useMarketPool } from '@/hooks/useMarketPoolsNew';

interface TickerItem {
  title: string;
  percentage: number;
  trend: 'up' | 'down';
  price: number;
}

export const TickerBar = () => {
  const { data: markets = [] } = useMarkets();
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get pool data for the first few markets
  const marketIds = markets.slice(0, 5).map(m => m.id);
  
  useEffect(() => {
    if (markets.length > 0) {
      const items: TickerItem[] = markets.slice(0, 8).map(market => ({
        title: market.titulo.slice(0, 40) + (market.titulo.length > 40 ? '...' : ''),
        percentage: Math.random() > 0.5 ? Math.random() * 10 + 50 : Math.random() * 10 + 40,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        price: Math.floor(Math.random() * 1000) + 500
      }));
      setTickerItems(items);
    }
  }, [markets]);

  useEffect(() => {
    if (tickerItems.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [tickerItems.length]);

  if (tickerItems.length === 0) return null;

  const currentItem = tickerItems[currentIndex];

  return (
    <div className="bg-card border-b border-border overflow-hidden">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-muted-foreground font-medium">MERCADO:</span>
            <span className="text-foreground font-semibold truncate">{currentItem.title}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {currentItem.trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-danger" />
            )}
            <span className={`font-bold ${currentItem.trend === 'up' ? 'text-success' : 'text-danger'}`}>
              {currentItem.percentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">VOLUME:</span>
            <span className="text-foreground font-semibold">{currentItem.price.toLocaleString()} RZ</span>
          </div>
        </div>
      </div>
    </div>
  );
};