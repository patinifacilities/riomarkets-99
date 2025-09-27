import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface OrderBookLevel {
  price: number;
  quantity: number;
  total_value: number;
  orders_count: number;
  cumulative_quantity?: number;
}

export interface DepthPoint {
  price: number;
  cumulative_quantity: number;
  side: 'buy' | 'sell';
}

export interface OrderBookData {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spread_percent: number;
  best_bid: number;
  best_ask: number;
  last_price: number;
  last_updated: string;
}

export interface DepthData {
  symbol: string;
  buy_depth: DepthPoint[];
  sell_depth: DepthPoint[];
  last_updated: string;
}

export interface OrderBookState {
  // Order book data
  orderBookData: OrderBookData | null;
  depthData: DepthData | null;
  
  // Loading states
  orderBookLoading: boolean;
  depthLoading: boolean;
  
  // Error states
  orderBookError: string | null;
  depthError: string | null;
  
  // Configuration
  maxLevels: number;
  updateInterval: number;
  
  // Actions
  fetchOrderBook: () => Promise<void>;
  fetchDepthData: () => Promise<void>;
  setMaxLevels: (levels: number) => void;
  startRealTimeUpdates: () => () => void;
  
  // Computed values
  getSpreadInfo: () => {
    spread: number;
    spreadPercent: number;
    bestBid: number;
    bestAsk: number;
    lastPrice: number;
  } | null;
}

export const useOrderBookStore = create<OrderBookState>((set, get) => ({
  // Initial state
  orderBookData: null,
  depthData: null,
  orderBookLoading: false,
  depthLoading: false,
  orderBookError: null,
  depthError: null,
  maxLevels: 15,
  updateInterval: 2000, // 2 seconds
  
  // Actions
  fetchOrderBook: async () => {
    set({ orderBookLoading: true, orderBookError: null });
    
    try {
      const { data, error } = await supabase.functions.invoke('get-orderbook');
      
      if (error) throw error;
      
      set({ 
        orderBookData: data,
        orderBookLoading: false 
      });
    } catch (error) {
      console.error('Error fetching order book:', error);
      set({ 
        orderBookError: error instanceof Error ? error.message : 'Failed to fetch order book',
        orderBookLoading: false 
      });
    }
  },
  
  fetchDepthData: async () => {
    set({ depthLoading: true, depthError: null });
    
    try {
      const { data, error } = await supabase.functions.invoke('get-orderbook-depth');
      
      if (error) throw error;
      
      set({ 
        depthData: data,
        depthLoading: false 
      });
    } catch (error) {
      console.error('Error fetching depth data:', error);
      set({ 
        depthError: error instanceof Error ? error.message : 'Failed to fetch depth data',
        depthLoading: false 
      });
    }
  },
  
  setMaxLevels: (levels: number) => {
    set({ maxLevels: Math.max(5, Math.min(50, levels)) });
  },
  
  startRealTimeUpdates: () => {
    const { fetchOrderBook, fetchDepthData, updateInterval } = get();
    
    // Initial fetch
    fetchOrderBook();
    fetchDepthData();
    
    // Set up interval for updates
    const intervalId = setInterval(() => {
      fetchOrderBook();
      // Fetch depth data less frequently (every 4 seconds)
      if (Date.now() % 4000 < updateInterval) {
        fetchDepthData();
      }
    }, updateInterval);
    
    // Listen to rates changes for immediate updates
    const channel = supabase
      .channel('orderbook-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rates',
          filter: 'symbol=eq.RIOZBRL'
        },
        (payload) => {
          console.log('Rate updated, refreshing orderbook:', payload);
          // Small delay to allow trigger to complete
          setTimeout(() => {
            fetchOrderBook();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('Orderbook realtime subscription status:', status);
      });
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
      console.log('Orderbook real-time updates stopped');
    };
  },
  
  // Computed values
  getSpreadInfo: () => {
    const { orderBookData } = get();
    if (!orderBookData) return null;
    
    return {
      spread: orderBookData.spread,
      spreadPercent: orderBookData.spread_percent,
      bestBid: orderBookData.best_bid,
      bestAsk: orderBookData.best_ask,
      lastPrice: orderBookData.last_price
    };
  }
}));