import { supabase } from '@/integrations/supabase/client';

export interface LimitOrder {
  id: string;
  user_id: string;
  side: 'buy_rioz' | 'sell_rioz';
  order_type: 'limit';
  amount_rioz: number;
  amount_brl: number;
  limit_price: number;
  price_brl_per_rioz?: number;
  fee_rioz: number;
  fee_brl: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired' | 'failed';
  expires_at?: string;
  created_at: string;
  filled_at?: string;
  cancelled_at?: string;
}

export interface CreateLimitOrderParams {
  side: 'buy_rioz' | 'sell_rioz';
  amountInput: number;
  inputCurrency: 'BRL' | 'RIOZ';
  limitPrice: number;
  expiresIn?: '1h' | '24h' | '7d' | 'custom';
  customExpiry?: Date;
}

export interface LimitOrderPreview {
  amountRioz: number;
  amountBrl: number;
  feeRioz: number;
  feeBrl: number;
  limitPrice: number;
  estimatedReturn?: string;
  priceImpact?: string;
}

export class LimitOrderService {
  /**
   * Create a new limit order
   */
  static async createLimitOrder(params: CreateLimitOrderParams): Promise<LimitOrder> {
    const { side, amountInput, inputCurrency, limitPrice, expiresIn, customExpiry } = params;

    // Calculate amounts based on input
    let amountRioz: number, amountBrl: number;
    
    if (inputCurrency === 'BRL') {
      amountBrl = amountInput;
      amountRioz = amountBrl / limitPrice;
    } else {
      amountRioz = amountInput;
      amountBrl = amountRioz * limitPrice;
    }

    // Calculate fees (2%)
    const feeRioz = side === 'buy_rioz' ? amountRioz * 0.02 : 0;
    const feeBrl = side === 'sell_rioz' ? amountBrl * 0.02 : 0;

    // Calculate expiry date
    let expiresAt: string | undefined;
    if (expiresIn && expiresIn !== 'custom') {
      const now = new Date();
      switch (expiresIn) {
        case '1h':
          now.setHours(now.getHours() + 1);
          break;
        case '24h':
          now.setHours(now.getHours() + 24);
          break;
        case '7d':
          now.setDate(now.getDate() + 7);
          break;
      }
      expiresAt = now.toISOString();
    } else if (customExpiry) {
      expiresAt = customExpiry.toISOString();
    }

    const { data, error } = await supabase
      .from('exchange_orders')
      .insert({
        side,
        amount_rioz: amountRioz,
        amount_brl: amountBrl,
        price_brl_per_rioz: limitPrice,
        fee_rioz: feeRioz,
        fee_brl: feeBrl,
        status: 'pending'
      } as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create limit order: ${error.message}`);
    }

    return data as LimitOrder;
  }

  /**
   * Cancel a limit order
   */
  static async cancelLimitOrder(orderId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('cancel-limit-order', {
      body: { orderId }
    });

    if (error) {
      throw new Error(`Failed to cancel limit order: ${error.message}`);
    }
  }

  /**
   * Get active limit orders for the current user
   */
  static async getActiveLimitOrders(): Promise<LimitOrder[]> {
    const { data, error } = await supabase
      .from('exchange_orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active orders: ${error.message}`);
    }

    // Filter for limit orders in client side until schema is updated
    return ((data || []) as any[]).filter((order: any) => 
      order.order_type === 'limit' || (!order.order_type && order.price_brl_per_rioz)
    ).map((order: any) => ({
      ...order,
      limit_price: order.limit_price || order.price_brl_per_rioz,
      order_type: 'limit'
    }));
  }

  /**
   * Get limit order history for the current user
   */
  static async getLimitOrderHistory(limit = 50): Promise<LimitOrder[]> {
    const { data, error } = await supabase
      .from('exchange_orders')
      .select('*')
      .in('status', ['filled', 'cancelled', 'expired', 'failed'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch order history: ${error.message}`);
    }

    // Filter for limit orders in client side until schema is updated
    return ((data || []) as any[]).filter((order: any) => 
      order.order_type === 'limit' || (!order.order_type && order.price_brl_per_rioz)
    ).map((order: any) => ({
      ...order,
      limit_price: order.limit_price || order.price_brl_per_rioz,
      order_type: 'limit'
    }));
  }

  /**
   * Calculate limit order preview
   */
  static calculateLimitOrderPreview(
    side: 'buy_rioz' | 'sell_rioz',
    amountInput: number,
    inputCurrency: 'BRL' | 'RIOZ',
    limitPrice: number,
    currentPrice: number
  ): LimitOrderPreview {
    let amountRioz: number, amountBrl: number;
    
    if (inputCurrency === 'BRL') {
      amountBrl = amountInput;
      amountRioz = amountBrl / limitPrice;
    } else {
      amountRioz = amountInput;
      amountBrl = amountRioz * limitPrice;
    }

    // Calculate fees
    const feeRioz = side === 'buy_rioz' ? amountRioz * 0.02 : 0;
    const feeBrl = side === 'sell_rioz' ? amountBrl * 0.02 : 0;

    // Calculate price impact
    const priceImpact = ((limitPrice - currentPrice) / currentPrice * 100).toFixed(2);
    
    // Calculate potential return if executed at limit price vs current price
    let estimatedReturn = '0%';
    if (side === 'buy_rioz') {
      const currentCost = amountRioz * currentPrice;
      const limitCost = amountBrl;
      const savings = currentCost - limitCost;
      const returnPercent = (savings / limitCost * 100);
      estimatedReturn = `${returnPercent > 0 ? '+' : ''}${returnPercent.toFixed(2)}%`;
    } else {
      const currentValue = amountRioz * currentPrice;
      const limitValue = amountBrl;
      const gain = limitValue - currentValue;
      const returnPercent = (gain / currentValue * 100);
      estimatedReturn = `${returnPercent > 0 ? '+' : ''}${returnPercent.toFixed(2)}%`;
    }

    return {
      amountRioz: amountRioz - feeRioz,
      amountBrl: amountBrl - feeBrl,
      feeRioz,
      feeBrl,
      limitPrice,
      estimatedReturn,
      priceImpact: `${priceImpact}%`
    };
  }

  /**
   * Validate limit order parameters
   */
  static validateLimitOrder(
    side: 'buy_rioz' | 'sell_rioz',
    limitPrice: number,
    currentPrice: number,
    amountBrl: number
  ): { isValid: boolean; error?: string } {
    // Check minimum amount
    if (amountBrl < 5) {
      return { isValid: false, error: 'Minimum order value is R$ 5.00' };
    }

    // Check maximum amount
    if (amountBrl > 5000) {
      return { isValid: false, error: 'Maximum order value is R$ 5,000.00' };
    }

    // Check price range (±20% of current price)
    const minPrice = currentPrice * 0.8;
    const maxPrice = currentPrice * 1.2;
    
    if (limitPrice < minPrice || limitPrice > maxPrice) {
      return { 
        isValid: false, 
        error: `Limit price must be between R$ ${minPrice.toFixed(4)} and R$ ${maxPrice.toFixed(4)}` 
      };
    }

    // Check price logic
    if (side === 'buy_rioz' && limitPrice > currentPrice) {
      return { 
        isValid: false, 
        error: 'Buy limit price should be below current price for better execution' 
      };
    }

    if (side === 'sell_rioz' && limitPrice < currentPrice) {
      return { 
        isValid: false, 
        error: 'Sell limit price should be above current price for better execution' 
      };
    }

    return { isValid: true };
  }

  /**
   * Format currency values
   */
  static formatCurrency(value: number, currency: 'BRL' | 'RIOZ'): string {
    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    } else {
      return `${value.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 6 
      })} RIOZ`;
    }
  }

  /**
   * Get status badge color
   */
  static getStatusColor(status: LimitOrder['status']): string {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'filled': return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'expired': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }
}