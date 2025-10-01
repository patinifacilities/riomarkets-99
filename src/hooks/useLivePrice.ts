import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Map asset symbols to Binance trading pairs
const getBinanceSymbol = (assetSymbol: string): string => {
  const symbolMap: Record<string, string> = {
    'BTC': 'btcusdt',
    'ETH': 'ethusdt',
    'SOL': 'solusdt',
    'GOLD': 'xauusdt',
    'SILVER': 'xagusdt',
  };
  return symbolMap[assetSymbol] || 'btcusdt';
};

// Check if asset is supported by Binance WebSocket
const isBinanceSupported = (assetSymbol: string): boolean => {
  return ['BTC', 'ETH', 'SOL', 'GOLD', 'SILVER'].includes(assetSymbol);
};

export const useLivePrice = (assetSymbol: string) => {
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let pollInterval: NodeJS.Timeout;
    
    const binanceSymbol = getBinanceSymbol(assetSymbol);
    const useBinance = isBinanceSupported(assetSymbol);
    
    if (useBinance) {
      // Use Binance WebSocket for supported assets
      const connectWebSocket = () => {
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol}@ticker`);
        
        ws.onopen = () => {
          setLoading(false);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const newPrice = parseFloat(data.c); // 'c' is the last price
            
            if (newPrice && !isNaN(newPrice)) {
              setPrice(newPrice);
            }
          } catch (error) {
            console.error('Error parsing Binance data:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };
      };
      
      connectWebSocket();
    } else {
      // Use polling for assets not supported by Binance
      const fetchPrice = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-market-data', {
            body: { symbols: [assetSymbol] }
          });
          
          if (error) throw error;
          
          const newPrice = data?.prices?.[assetSymbol];
          if (newPrice && !isNaN(newPrice)) {
            setPrice(newPrice);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error fetching price:', error);
        }
      };
      
      fetchPrice();
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
  }, [assetSymbol]);

  return { price, loading };
};
