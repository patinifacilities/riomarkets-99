import { useExchangeStore } from '@/stores/useExchangeStore';
import { supabase } from '@/integrations/supabase/client';

interface OrderBookLevel {
  id: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  user_id: string;
}

export class OrderBookMatcher {
  static async matchMarketOrder(
    userId: string,
    side: 'buy_rioz' | 'sell_rioz',
    amount: number,
    inputCurrency: 'RIOZ' | 'BRL'
  ) {
    try {
      // Get current price
      const { data: rateData } = await supabase
        .from('rates')
        .select('price')
        .eq('symbol', 'RIOZBRL')
        .single();

      if (!rateData) throw new Error('Price not available');

      const currentPrice = rateData.price;

      // Execute market order using existing function
      const { data, error } = await supabase.rpc('execute_market_order', {
        p_user_id: userId,
        p_side: side,
        p_amount_input: amount,
        p_input_currency: inputCurrency,
        p_current_price: currentPrice
      });

      if (error) throw error;
      
      if (!data?.[0]?.success) {
        throw new Error(data?.[0]?.message || 'Failed to execute order');
      }

      const result = data[0];

      // Create transaction record
      await supabase.from('exchange_orders').insert({
        user_id: userId,
        side,
        price_brl_per_rioz: currentPrice,
        amount_rioz: result.amount_converted,
        amount_brl: side === 'buy_rioz' ? amount : result.amount_converted * currentPrice,
        fee_rioz: side === 'sell_rioz' ? result.fee_charged : 0,
        fee_brl: side === 'buy_rioz' ? result.fee_charged : 0,
        status: 'filled',
        filled_at: new Date().toISOString()
      });

      return {
        success: true,
        newRiozBalance: result.new_rioz_balance,
        newBrlBalance: result.new_brl_balance,
        amountConverted: result.amount_converted,
        feeCharged: result.fee_charged,
        executionPrice: currentPrice
      };

    } catch (error) {
      console.error('Order matching error:', error);
      throw error;
    }
  }

  static async placeLimitOrder(
    userId: string,
    side: 'buy_rioz' | 'sell_rioz',
    amountRioz: number,
    limitPrice: number
  ) {
    try {
      const amountBrl = amountRioz * limitPrice;

      const { data, error } = await supabase
        .from('exchange_orders')
        .insert({
          user_id: userId,
          side,
          price_brl_per_rioz: limitPrice,
          amount_rioz: amountRioz,
          amount_brl: amountBrl,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        orderId: data.id,
        message: 'Ordem limite criada com sucesso'
      };

    } catch (error) {
      console.error('Limit order error:', error);
      throw error;
    }
  }
}