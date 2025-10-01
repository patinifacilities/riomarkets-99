import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface PricePoint {
  time: number;
  price: number;
}

interface LivePriceChartProps {
  assetSymbol: string;
  assetName: string;
  poolStartPrice?: number; // Optional: price when pool started
}

// Map asset symbols to Binance trading pairs and real-time data sources
const getBinanceSymbol = (assetSymbol: string): string => {
  const symbolMap: Record<string, string> = {
    'BTC': 'btcusdt',
    'ETH': 'ethusdt',
    'SOL': 'solusdt',
    'GOLD': 'xauusdt', // Gold vs USDT on Binance
    'SILVER': 'xagusdt', // Silver vs USDT on Binance
  };
  return symbolMap[assetSymbol] || 'btcusdt';
};

// Check if asset is supported by Binance WebSocket
const isBinanceSupported = (assetSymbol: string): boolean => {
  return ['BTC', 'ETH', 'SOL', 'GOLD', 'SILVER'].includes(assetSymbol);
};

export const LivePriceChart = ({ assetSymbol, assetName, poolStartPrice }: LivePriceChartProps) => {
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [initialPrice, setInitialPrice] = useState<number>(0);
  const [dataSource, setDataSource] = useState<'binance' | 'api'>('binance');

  // Set initialPrice to poolStartPrice when it's provided (pool start reference)
  useEffect(() => {
    if (poolStartPrice && poolStartPrice > 0) {
      setInitialPrice(poolStartPrice);
    }
  }, [poolStartPrice]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let pollInterval: NodeJS.Timeout;
    
    const binanceSymbol = getBinanceSymbol(assetSymbol);
    const useBinance = isBinanceSupported(assetSymbol);
    
    if (useBinance) {
      // Use Binance WebSocket for supported assets
      setDataSource('binance');
      
      const connectWebSocket = () => {
        // Connect to Binance WebSocket for real-time price
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol}@ticker`);
        
        ws.onopen = () => {
          console.log('Connected to Binance WebSocket');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const price = parseFloat(data.c); // 'c' is the last price
            
            if (price && !isNaN(price)) {
              const now = Date.now();
              
              setCurrentPrice(price);
              
              // Calculate price change relative to pool start price or initial price
              const referencePrice = poolStartPrice || initialPrice;
              if (referencePrice > 0) {
                setPriceChange(((price - referencePrice) / referencePrice) * 100);
              }
              
              // Add to price data
              setPriceData(prevData => {
                const newData = [...prevData, { time: now, price }];
                // Keep only last 50 points
                return newData.slice(-50);
              });
            }
          } catch (error) {
            console.error('Error parsing Binance data:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
          console.log('Disconnected from Binance WebSocket, reconnecting...');
          // Reconnect after 3 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };
      };
      
      connectWebSocket();
    } else {
      // Use polling for assets not supported by Binance (stocks, oil, etc.)
      setDataSource('api');
      
      const fetchPrice = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-market-data', {
            body: { symbols: [assetSymbol] }
          });
          
          if (error) throw error;
          
          const price = data?.prices?.[assetSymbol];
          if (price && !isNaN(price)) {
            const now = Date.now();
            
            setCurrentPrice(price);
            
            // Calculate price change relative to pool start price or initial price
            const referencePrice = poolStartPrice || initialPrice;
            if (referencePrice > 0) {
              setPriceChange(((price - referencePrice) / referencePrice) * 100);
            }
            
            setPriceData(prevData => {
              const newData = [...prevData, { time: now, price }];
              return newData.slice(-50);
            });
          }
        } catch (error) {
          console.error('Error fetching price:', error);
        }
      };
      
      // Initial fetch
      fetchPrice();
      
      // Poll every 1 second
      pollInterval = setInterval(fetchPrice, 1000);
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [assetSymbol, poolStartPrice, initialPrice]);

  // Calculate chart dimensions and scaling
  // Always include poolStartPrice and current price in the range
  const prices = priceData.map(p => p.price);
  if (poolStartPrice) prices.push(poolStartPrice);
  if (currentPrice) prices.push(currentPrice);
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const padding = priceRange * 0.2; // Increased padding to ensure visibility
  
  // Adjust min/max with padding
  const adjustedMin = minPrice - padding;
  const adjustedMax = maxPrice + padding;
  const adjustedRange = adjustedMax - adjustedMin;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Preço ao Vivo - {assetName}</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-[#00ff90]' : 'text-[#ff2389]'}`}>
              {priceChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="font-semibold">
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-64 bg-gradient-to-br from-muted/40 via-muted/30 to-muted/20 rounded-lg overflow-hidden border border-border/50">
          {priceData.length > 1 && (
            <svg className="w-full h-full" viewBox="0 0 800 256" preserveAspectRatio="none">
              <defs>
                <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" className={priceChange >= 0 ? 'text-[#00ff90]' : 'text-[#ff2389]'} stopColor="currentColor" stopOpacity="0.3" />
                  <stop offset="100%" className={priceChange >= 0 ? 'text-[#00ff90]' : 'text-[#ff2389]'} stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Pool start price indicator line (if available) */}
              {poolStartPrice && (
                <>
                  <line
                    x1="0"
                    y1={256 - ((poolStartPrice - adjustedMin) / adjustedRange) * 240}
                    x2="800"
                    y2={256 - ((poolStartPrice - adjustedMin) / adjustedRange) * 240}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.6"
                  />
                  <circle
                    cx="0"
                    cy={256 - ((poolStartPrice - adjustedMin) / adjustedRange) * 240}
                    r="5"
                    fill="#fbbf24"
                  />
                </>
              )}
              
              {/* Area under the line */}
              <path
                d={`
                  M 0 256
                  ${priceData.map((point, index) => {
                    const x = (index / (priceData.length - 1)) * 800;
                    const y = 256 - ((point.price - adjustedMin) / adjustedRange) * 240;
                    return `L ${x} ${y}`;
                  }).join(' ')}
                  L 800 256
                  Z
                `}
                fill="url(#priceGradient)"
              />
              
              {/* Price line */}
              <path
                d={priceData.map((point, index) => {
                  const x = (index / (priceData.length - 1)) * 800;
                  const y = 256 - ((point.price - adjustedMin) / adjustedRange) * 240;
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke={priceChange >= 0 ? '#00ff90' : '#ff2389'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Live indicator at the end */}
              {priceData.length > 0 && (
                <>
                  <circle
                    cx="800"
                    cy={256 - ((priceData[priceData.length - 1].price - adjustedMin) / adjustedRange) * 240}
                    r="6"
                    fill={priceChange >= 0 ? '#00ff90' : '#ff2389'}
                    className="animate-pulse"
                  />
                  <circle
                    cx="800"
                    cy={256 - ((priceData[priceData.length - 1].price - adjustedMin) / adjustedRange) * 240}
                    r="10"
                    fill={priceChange >= 0 ? '#00ff90' : '#ff2389'}
                    opacity="0.3"
                    className="animate-ping"
                  />
                </>
              )}
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
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ff2389] animate-pulse" />
            <span className="font-semibold">{dataSource === 'binance' ? 'BINANCE LIVE' : 'API LIVE'}</span>
          </div>
          <span>Máx: ${maxPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </CardContent>
    </Card>
  );
};
