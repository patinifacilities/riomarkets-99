import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PricePoint {
  time: number;
  price: number;
}

interface LivePriceChartProps {
  assetSymbol: string;
  assetName: string;
}

export const LivePriceChart = ({ assetSymbol, assetName }: LivePriceChartProps) => {
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);

  useEffect(() => {
    // Simulate live price updates
    const initialPrice = 50000 + Math.random() * 10000;
    setCurrentPrice(initialPrice);
    
    const interval = setInterval(() => {
      const now = Date.now();
      const change = (Math.random() - 0.5) * 100;
      const newPrice = currentPrice + change;
      
      setCurrentPrice(newPrice);
      setPriceChange(((newPrice - initialPrice) / initialPrice) * 100);
      
      setPriceData(prev => {
        const newData = [...prev, { time: now, price: newPrice }];
        // Keep only last 50 points
        return newData.slice(-50);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const maxPrice = Math.max(...priceData.map(p => p.price), currentPrice);
  const minPrice = Math.min(...priceData.map(p => p.price), currentPrice);
  const priceRange = maxPrice - minPrice || 1;

  return (
    <Card className="bg-card-secondary border-border-secondary">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Preço ao Vivo - {assetName}</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-success' : 'text-danger'}`}>
              {priceChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="font-semibold">
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-64 bg-background/50 rounded-lg overflow-hidden">
          {priceData.length > 1 && (
            <svg className="w-full h-full">
              <defs>
                <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" className="text-primary" stopColor="currentColor" stopOpacity="0.3" />
                  <stop offset="100%" className="text-primary" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Area under the line */}
              <path
                d={`
                  M 0 ${256}
                  ${priceData.map((point, index) => {
                    const x = (index / (priceData.length - 1)) * 100;
                    const y = 256 - ((point.price - minPrice) / priceRange) * 240;
                    return `L ${x}% ${y}`;
                  }).join(' ')}
                  L 100% ${256}
                  Z
                `}
                fill="url(#priceGradient)"
              />
              
              {/* Price line */}
              <path
                d={priceData.map((point, index) => {
                  const x = (index / (priceData.length - 1)) * 100;
                  const y = 256 - ((point.price - minPrice) / priceRange) * 240;
                  return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`;
                }).join(' ')}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          
          {priceData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Carregando dados ao vivo...
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Mín: ${minPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span>Atualização em tempo real</span>
          <span>Máx: ${maxPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </CardContent>
    </Card>
  );
};
