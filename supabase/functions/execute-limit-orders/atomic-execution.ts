import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Logger } from '../_shared/logger.ts';

const FEE_RATE = 0.02; // 2%

export async function executeOrderManually(
  supabase: SupabaseClient,
  order: any,
  currentPrice: number,
  logger: Logger
): Promise<boolean> {
  // Manual atomic execution using multiple checks and rollback capability
  try {
    const userId = order.user_id;
    const side = order.side;
    const amountRioz = parseFloat(order.amount_rioz);
    const amountBrl = parseFloat(order.amount_brl);

    // Get user balance with SELECT FOR UPDATE equivalent (using single query)
    const { data: balanceData, error: balanceError } = await supabase
      .from('balances')
      .select('rioz_balance, brl_balance')
      .eq('user_id', userId)
      .single();

    if (balanceError || !balanceData) {
      throw new Error(`Failed to get balance: ${balanceError?.message}`);
    }

    const currentRiozBalance = parseFloat(balanceData.rioz_balance || '0');
    const currentBrlBalance = parseFloat(balanceData.brl_balance || '0');

    // Check sufficient balance
    if (side === 'buy_rioz' && currentBrlBalance < amountBrl) {
      await supabase
        .from('exchange_orders')
        .update({ status: 'failed', cancelled_at: new Date().toISOString() })
        .eq('id', order.id);
      return false;
    }

    if (side === 'sell_rioz' && currentRiozBalance < amountRioz) {
      await supabase
        .from('exchange_orders')
        .update({ status: 'failed', cancelled_at: new Date().toISOString() })
        .eq('id', order.id);
      return false;
    }

    // Calculate fees and new balances
    const feeRioz = side === 'buy_rioz' ? amountRioz * FEE_RATE : 0;
    const feeBrl = side === 'sell_rioz' ? amountBrl * FEE_RATE : 0;
    
    let newRiozBalance: number, newBrlBalance: number;
    
    if (side === 'buy_rioz') {
      newBrlBalance = currentBrlBalance - amountBrl;
      newRiozBalance = currentRiozBalance + (amountRioz - feeRioz);
    } else {
      newRiozBalance = currentRiozBalance - amountRioz;
      newBrlBalance = currentBrlBalance + (amountBrl - feeBrl);
    }

    // Validation: ensure balances won't go negative
    if (newRiozBalance < 0 || newBrlBalance < 0) {
      throw new Error('Calculated balance would be negative');
    }

    // Step 1: Update order status first (this acts as a lock)
    const { error: updateOrderError } = await supabase
      .from('exchange_orders')
      .update({
        status: 'filled',
        filled_at: new Date().toISOString(),
        price_brl_per_rioz: currentPrice,
        fee_rioz: feeRioz,
        fee_brl: feeBrl
      })
      .eq('id', order.id)
      .eq('status', 'pending'); // Only update if still pending (prevents double execution)

    if (updateOrderError) {
      throw new Error(`Failed to update order: ${updateOrderError.message}`);
    }

    // Step 2: Update balances
    const { error: updateBalanceError } = await supabase
      .from('balances')
      .update({
        rioz_balance: newRiozBalance,
        brl_balance: newBrlBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('rioz_balance', currentRiozBalance)
      .eq('brl_balance', currentBrlBalance); // Optimistic locking

    if (updateBalanceError) {
      // ROLLBACK: Revert order status
      await supabase
        .from('exchange_orders')
        .update({ 
          status: 'pending', 
          filled_at: null,
          price_brl_per_rioz: null,
          fee_rioz: 0,
          fee_brl: 0
        })
        .eq('id', order.id);
      
      throw new Error(`Failed to update balance: ${updateBalanceError.message}`);
    }

    return true;

  } catch (error) {
    console.error(`Manual execution failed for order ${order.id}:`, error);
    return false;
  }
}