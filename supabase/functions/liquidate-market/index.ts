import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LiquidationRequest {
  marketId: string;
  winningOption: string;
}

interface LiquidationPreview {
  S_total: number;
  S_win: number;
  S_lose: number;
  fee: number;
  profit_pool: number;
  multiplicador_efetivo: number;
  pools: Record<string, number>;
  bettors: Record<string, number>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { marketId, winningOption }: LiquidationRequest = await req.json();

    console.log(`Starting liquidation for market ${marketId}, winning option: ${winningOption}`);

    // Validate market exists and status
    const { data: market, error: marketError } = await supabaseClient
      .from('markets')
      .select('status, opcoes')
      .eq('id', marketId)
      .single();

    if (marketError || !market) {
      throw new Error('Market not found');
    }

    if (market.status === 'liquidado') {
      throw new Error('Market already liquidated');
    }

    if (!['aberto', 'fechado'].includes(market.status)) {
      throw new Error('Market must be open or closed to liquidate');
    }

    if (!market.opcoes.includes(winningOption)) {
      throw new Error('Invalid winning option for this market');
    }

    // Get platform settings for fee calculation
    const { data: settings, error: settingsError } = await supabaseClient
      .from('settings')
      .select('fee_percent')
      .single();

    if (settingsError) {
      console.error('Settings error:', settingsError);
      throw new Error('Failed to get platform settings');
    }

    const feePercent = settings.fee_percent || 0.20;

    // Get all active orders for this market (exclude cashouts)
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('market_id', marketId)
      .eq('status', 'ativa');

    if (ordersError) {
      console.error('Orders error:', ordersError);
      throw new Error('Failed to get market orders');
    }

    if (!orders || orders.length === 0) {
      console.log('No active orders found for market');
      return new Response(
        JSON.stringify({ message: 'No active orders to liquidate' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate pools by option
    const pools: Record<string, number> = {};
    const bettors: Record<string, number> = {};
    
    // Initialize all options
    market.opcoes.forEach((opcao: string) => {
      pools[opcao] = 0;
      bettors[opcao] = 0;
    });

    // Calculate pools for each option
    orders.forEach(order => {
      pools[order.opcao_escolhida] += order.quantidade_moeda;
      bettors[order.opcao_escolhida] += 1;
    });

    // Universal pari-passu formula
    const S_total = Object.values(pools).reduce((sum, pool) => sum + pool, 0);
    const S_win = pools[winningOption] || 0;
    const S_lose = S_total - S_win;

    console.log(`S_total: ${S_total}, S_win: ${S_win}, S_lose: ${S_lose}`);

    // Protection against S_win = 0
    if (S_win === 0) {
      throw new Error('No one bet on the winning option. Admin intervention required.');
    }

    // Calculate fee and profit pool
    const fee = S_lose * feePercent;
    const profit_pool = S_lose - fee;
    const multiplicador_efetivo = (S_total - fee) / S_win;

    console.log(`Fee: ${fee}, Profit pool: ${profit_pool}, Multiplicador: ${multiplicador_efetivo}`);

    // Separate winning and losing orders
    const winningOrders = orders.filter(order => order.opcao_escolhida === winningOption);
    const losingOrders = orders.filter(order => order.opcao_escolhida !== winningOption);

    // Process winning orders with universal formula
    const transactions = [];
    for (const order of winningOrders) {
      // Universal payout formula: payout_i = stake_i + (stake_i / S_win) * profit_pool
      const payout = order.quantidade_moeda + (order.quantidade_moeda / Math.max(S_win, 1e-9)) * profit_pool;

      console.log(`User ${order.user_id}: stake ${order.quantidade_moeda}, payout ${payout} (${multiplicador_efetivo.toFixed(3)}x)`);

      // Create credit transaction
      const { error: transactionError } = await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: order.user_id,
          tipo: 'credito',
          valor: Math.round(payout),
          descricao: `Liquidação ${marketId} - ${winningOption}`,
          market_id: marketId
        });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw new Error(`Failed to create transaction for user ${order.user_id}`);
      }

      // Update user balance (using profiles table)
      const { data: user, error: userFetchError } = await supabaseClient
        .from('profiles')
        .select('saldo_moeda')
        .eq('id', order.user_id)
        .single();

      if (userFetchError) {
        console.error('User fetch error:', userFetchError);
        throw new Error(`Failed to fetch user ${order.user_id}`);
      }

      const { error: balanceError } = await supabaseClient
        .from('profiles')
        .update({ saldo_moeda: user.saldo_moeda + Math.round(payout) })
        .eq('id', order.user_id);

      if (balanceError) {
        console.error('Balance error:', balanceError);
        throw new Error(`Failed to update balance for user ${order.user_id}`);
      }

      // Update order status
      const { error: orderUpdateError } = await supabaseClient
        .from('orders')
        .update({ status: 'ganha' })
        .eq('id', order.id);

      if (orderUpdateError) {
        console.error('Order update error:', orderUpdateError);
        throw new Error(`Failed to update order ${order.id}`);
      }

      transactions.push({
        userId: order.user_id,
        amount: Math.round(payout),
        type: 'win'
      });
    }

    // Update losing orders status
    for (const order of losingOrders) {
      const { error: orderUpdateError } = await supabaseClient
        .from('orders')
        .update({ status: 'perdida' })
        .eq('id', order.id);

      if (orderUpdateError) {
        console.error('Losing order update error:', orderUpdateError);
        throw new Error(`Failed to update losing order ${order.id}`);
      }
    }

    // Create admin fee transaction (find admin user)
    if (fee > 0) {
      const { data: adminUser, error: adminError } = await supabaseClient
        .from('profiles')
        .select('id, saldo_moeda')
        .eq('is_admin', true)
        .limit(1)
        .single();

      if (!adminError && adminUser) {
        const { error: adminTransactionError } = await supabaseClient
          .from('wallet_transactions')
          .insert({
            user_id: adminUser.id,
            tipo: 'credito',
            valor: Math.round(fee),
            descricao: `Taxa de liquidação (${(feePercent * 100).toFixed(1)}%) - Mercado ${marketId}`,
            market_id: marketId
          });

        if (adminTransactionError) {
          console.error('Admin transaction error:', adminTransactionError);
        } else {
          // Update admin balance
          await supabaseClient
            .from('profiles')
            .update({ saldo_moeda: adminUser.saldo_moeda + Math.round(fee) })
            .eq('id', adminUser.id);
        }
      }
    }

    // Update market status
    const { error: marketUpdateError } = await supabaseClient
      .from('markets')
      .update({ status: 'liquidado' })
      .eq('id', marketId);

    if (marketUpdateError) {
      console.error('Market update error:', marketUpdateError);
      throw new Error('Failed to update market status');
    }

    // Create result record
    const { error: resultError } = await supabaseClient
      .from('results')
      .insert({
        market_id: marketId,
        resultado_vencedor: winningOption,
        tx_executada: true
      });

    if (resultError) {
      console.error('Result error:', resultError);
      throw new Error('Failed to create result record');
    }

    const result = {
      marketId,
      winningOption,
      S_total,
      S_win,
      S_lose,
      fee: Math.round(fee),
      profit_pool: Math.round(profit_pool),
      multiplicador_efetivo: Number(multiplicador_efetivo.toFixed(4)),
      pools,
      bettors,
      transactionsProcessed: transactions.length,
      feePercent
    };

    console.log('Liquidation completed:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Liquidation error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});