import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Rate {
  price: number;
  change24h: number;
  updated_at: string;
  symbol: string;
}

export interface Balance {
  rioz_balance: number;
  brl_balance: number;
  updated_at: string;
}

export interface ExchangeOrder {
  id: string;
  side: 'buy_rioz' | 'sell_rioz';
  price_brl_per_rioz: number;
  amount_rioz: number;
  amount_brl: number;
  fee_rioz: number;
  fee_brl: number;
  status: 'pending' | 'filled' | 'failed';
  created_at: string;
  operation_type: string;
}

export interface ExchangeState {
  // Rate data
  rate: Rate | null;
  rateLoading: boolean;
  rateError: string | null;
  
  // Balance data
  balance: Balance | null;
  balanceLoading: boolean;
  balanceError: string | null;
  
  // History data
  history: ExchangeOrder[];
  historyLoading: boolean;
  historyError: string | null;
  historyPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  
  // Exchange operations
  exchangeLoading: boolean;
  exchangeError: string | null;
  
  // Actions
  fetchRate: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  fetchHistory: (page?: number) => Promise<void>;
  performExchange: (side: 'buy_rioz' | 'sell_rioz', amountInput: number, inputCurrency: 'BRL' | 'RIOZ') => Promise<any>;
  subscribeToRateUpdates: () => () => void;
}

export const useExchangeStore = create<ExchangeState>((set, get) => ({
  // Initial state
  rate: null,
  rateLoading: false,
  rateError: null,
  
  balance: null,
  balanceLoading: false,
  balanceError: null,
  
  history: [],
  historyLoading: false,
  historyError: null,
  historyPagination: null,
  
  exchangeLoading: false,
  exchangeError: null,
  
  // Actions
  fetchRate: async () => {
    set({ rateLoading: true, rateError: null });
    
    try {
      // Set fixed rate for RIOZ as stable coin at R$1
      const stableRate = {
        price: 1.0,
        change24h: 0,
        updated_at: new Date().toISOString(),
        symbol: 'RIOZBRL'
      };
      
      set({ 
        rate: stableRate,
        rateLoading: false 
      });
    } catch (error) {
      console.error('Error fetching rate:', error);
      set({ 
        rateError: error instanceof Error ? error.message : 'Failed to fetch rate',
        rateLoading: false 
      });
    }
  },
  
  fetchBalance: async () => {
    set({ balanceLoading: true, balanceError: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('balances')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        // If balance doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: newBalance, error: createError } = await supabase
            .from('balances')
            .insert({
              user_id: user.id,
              rioz_balance: 0,
              brl_balance: 0
            })
            .select()
            .single();
            
          if (createError) throw createError;
          
      set({ 
        balance: {
          rioz_balance: parseFloat(String(newBalance.rioz_balance)),
          brl_balance: parseFloat(String(newBalance.brl_balance)),
          updated_at: newBalance.updated_at
        },
        balanceLoading: false 
      });
      
      // Dispatch balance update event for other components
      window.dispatchEvent(new CustomEvent('balanceUpdated', { 
        detail: newBalance 
      }));
          return;
        }
        throw error;
      }
      
      set({ 
        balance: {
          rioz_balance: parseFloat(String(data.rioz_balance)),
          brl_balance: parseFloat(String(data.brl_balance)),
          updated_at: data.updated_at
        },
        balanceLoading: false 
      });
      
      // Dispatch balance update event for other components
      window.dispatchEvent(new CustomEvent('balanceUpdated', { 
        detail: data 
      }));
    } catch (error) {
      console.error('Error fetching balance:', error);
      set({ 
        balanceError: error instanceof Error ? error.message : 'Failed to fetch balance',
        balanceLoading: false 
      });
    }
  },
  
  fetchHistory: async (page = 1) => {
    set({ historyLoading: true, historyError: null });
    
    try {
      const { data, error } = await supabase.functions.invoke('get-history', {
        body: { page, limit: 10 }
      });
      
      if (error) throw error;
      
      set({ 
        history: data.data || [],
        historyPagination: data.pagination,
        historyLoading: false 
      });
    } catch (error) {
      console.error('Error fetching history:', error);
      set({ 
        historyError: error instanceof Error ? error.message : 'Failed to fetch history',
        historyLoading: false 
      });
    }
  },
  
  performExchange: async (side: 'buy_rioz' | 'sell_rioz', amountInput: number, inputCurrency: 'BRL' | 'RIOZ') => {
    set({ exchangeLoading: true, exchangeError: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current balances
      const { data: profile } = await supabase
        .from('profiles')
        .select('saldo_moeda')
        .eq('id', user.id)
        .single();

      const { data: balance } = await supabase
        .from('balances')
        .select('brl_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || !balance) throw new Error('User data not found');

      const currentRiozBalance = profile.saldo_moeda;
      const currentBrlBalance = balance.brl_balance;

      // Calculate new balances based on operation
      let newRiozBalance = currentRiozBalance;
      let newBrlBalance = currentBrlBalance;
      let totalCost = 0;

      if (side === 'buy_rioz') {
        // Buying RIOZ with BRL
        totalCost = amountInput * 1.0; // 1 RIOZ = 1 BRL
        
        if (currentBrlBalance < totalCost) {
          throw new Error('Saldo BRL insuficiente');
        }
        
        newRiozBalance = currentRiozBalance + amountInput;
        newBrlBalance = currentBrlBalance - totalCost;
      } else {
        // Selling RIOZ for BRL
        if (currentRiozBalance < amountInput) {
          throw new Error('Saldo RIOZ insuficiente');
        }
        
        totalCost = amountInput * 1.0; // 1 RIOZ = 1 BRL
        newRiozBalance = currentRiozBalance - amountInput;
        newBrlBalance = currentBrlBalance + totalCost;
      }

      // Update both balances atomically
      const [profileUpdate, balanceUpdate] = await Promise.all([
        supabase
          .from('profiles')
          .update({ saldo_moeda: Math.round(newRiozBalance) })
          .eq('id', user.id),
        supabase
          .from('balances')
          .update({ brl_balance: newBrlBalance })
          .eq('user_id', user.id)
      ]);

      if (profileUpdate.error) throw profileUpdate.error;
      if (balanceUpdate.error) throw balanceUpdate.error;

      // Log the exchange transaction
      await supabase
        .from('exchange_orders')
        .insert({
          user_id: user.id,
          side,
          price_brl_per_rioz: 1.0,
          amount_rioz: amountInput,
          amount_brl: totalCost,
          status: 'filled',
          filled_at: new Date().toISOString()
        });
      
      // Refresh balance and skip history to avoid errors
      const store = get();
      await store.fetchBalance();
      
      // Dispatch events to update UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        window.dispatchEvent(new CustomEvent('forceProfileRefresh'));
      }
      
      set({ exchangeLoading: false });
      return { success: true, new_rioz_balance: newRiozBalance, new_brl_balance: newBrlBalance };
    } catch (error) {
      console.error('Error performing exchange:', error);
      const errorMessage = error instanceof Error ? error.message : 'Exchange failed';
      set({ 
        exchangeError: errorMessage,
        exchangeLoading: false 
      });
      throw error;
    }
  },
  
  // Subscribe to real-time rate updates with better error handling
  subscribeToRateUpdates: () => {
    const channel = supabase
      .channel('rates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rates',
          filter: 'symbol=eq.RIOZBRL'
        },
        (payload) => {
          console.log('Rate update received:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newRateData = payload.new as any;
            const newRate: Rate = {
              price: parseFloat(newRateData.price) || 0,
              change24h: parseFloat(newRateData.change24h) || 0,
              updated_at: newRateData.updated_at || new Date().toISOString(),
              symbol: newRateData.symbol || 'RIOZBRL'
            };
            set({ rate: newRate });
            console.log('Rate updated:', newRate);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from rate updates');
      supabase.removeChannel(channel);
    };
  }
}));