import { create } from 'zustand';
import { LimitOrder, LimitOrderService } from '@/services/limitOrders';
import { supabase } from '@/integrations/supabase/client';

interface LimitOrderState {
  // Active orders
  activeOrders: LimitOrder[];
  activeOrdersLoading: boolean;
  activeOrdersError: string | null;
  
  // Order history
  orderHistory: LimitOrder[];
  historyLoading: boolean;
  historyError: string | null;
  
  // Order operations
  creatingOrder: boolean;
  cancellingOrder: string | null; // Order ID being cancelled
  operationError: string | null;
  
  // Actions
  fetchActiveOrders: () => Promise<void>;
  fetchOrderHistory: () => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  subscribeToOrderUpdates: () => () => void;
  clearErrors: () => void;
}

export const useLimitOrderStore = create<LimitOrderState>((set, get) => ({
  // Initial state
  activeOrders: [],
  activeOrdersLoading: false,
  activeOrdersError: null,
  
  orderHistory: [],
  historyLoading: false,
  historyError: null,
  
  creatingOrder: false,
  cancellingOrder: null,
  operationError: null,
  
  // Actions
  fetchActiveOrders: async () => {
    set({ activeOrdersLoading: true, activeOrdersError: null });
    
    try {
      const orders = await LimitOrderService.getActiveLimitOrders();
      set({ 
        activeOrders: orders,
        activeOrdersLoading: false 
      });
    } catch (error) {
      console.error('Error fetching active orders:', error);
      set({ 
        activeOrdersError: error instanceof Error ? error.message : 'Failed to fetch active orders',
        activeOrdersLoading: false 
      });
    }
  },
  
  fetchOrderHistory: async () => {
    set({ historyLoading: true, historyError: null });
    
    try {
      const orders = await LimitOrderService.getLimitOrderHistory();
      set({ 
        orderHistory: orders,
        historyLoading: false 
      });
    } catch (error) {
      console.error('Error fetching order history:', error);
      set({ 
        historyError: error instanceof Error ? error.message : 'Failed to fetch order history',
        historyLoading: false 
      });
    }
  },
  
  cancelOrder: async (orderId: string) => {
    set({ cancellingOrder: orderId, operationError: null });
    
    try {
      await LimitOrderService.cancelLimitOrder(orderId);
      
      // Remove from active orders and add to history
      const { activeOrders, orderHistory } = get();
      const cancelledOrder = activeOrders.find(order => order.id === orderId);
      
      if (cancelledOrder) {
        const updatedOrder = { 
          ...cancelledOrder, 
          status: 'cancelled' as const,
          cancelled_at: new Date().toISOString() 
        };
        
        set({
          activeOrders: activeOrders.filter(order => order.id !== orderId),
          orderHistory: [updatedOrder, ...orderHistory],
          cancellingOrder: null
        });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      set({ 
        operationError: error instanceof Error ? error.message : 'Failed to cancel order',
        cancellingOrder: null 
      });
    }
  },
  
  subscribeToOrderUpdates: () => {
    const channel = supabase
      .channel('limit-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exchange_orders',
          filter: 'order_type=eq.limit'
        },
        (payload) => {
          console.log('Limit order update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as LimitOrder;
            if (newOrder.status === 'pending') {
              set(state => ({
                activeOrders: [newOrder, ...state.activeOrders]
              }));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as LimitOrder;
            const { activeOrders, orderHistory } = get();
            
            if (updatedOrder.status === 'pending') {
              // Update in active orders
              set({
                activeOrders: activeOrders.map(order => 
                  order.id === updatedOrder.id ? updatedOrder : order
                )
              });
            } else {
              // Move to history
              set({
                activeOrders: activeOrders.filter(order => order.id !== updatedOrder.id),
                orderHistory: [updatedOrder, ...orderHistory.filter(order => order.id !== updatedOrder.id)]
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Limit orders subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from limit orders updates');
      supabase.removeChannel(channel);
    };
  },
  
  clearErrors: () => {
    set({ 
      activeOrdersError: null,
      historyError: null,
      operationError: null 
    });
  }
}));