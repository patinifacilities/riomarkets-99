import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LiquidationRequest {
  marketId: string;
  winningOption: string;
}

interface LiquidationPreview {
  marketId: string;
  winningOption: string;
  totalPool: number;
  winningPool: number;
  losingPool: number;
  platformFee: number;
  profitPool: number;
  effectiveMultiplier: number;
  winningOrders: number;
  losingOrders: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { marketId, winningOption }: LiquidationRequest = await req.json();
    
    console.log(`Starting liquidation for market: ${marketId}, winner: ${winningOption}`);

    // Validate market exists and is not already liquidated
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single();

    if (marketError || !market) {
      throw new Error(`Market not found: ${marketId}`);
    }

    if (market.status === 'liquidado') {
      throw new Error('Market is already liquidated');
    }

    // Validate winning option
    if (!market.opcoes.includes(winningOption)) {
      throw new Error(`Invalid winning option: ${winningOption}. Must be one of: ${market.opcoes.join(', ')}`);
    }

    // Get platform settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('fee_percent')
      .single();

    if (settingsError || !settings) {
      throw new Error('Platform settings not found');
    }

    const feePercent = settings.fee_percent;

    // Get all active orders for this market
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('market_id', marketId)
      .eq('status', 'ativa');

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      console.log('No active orders found for market');
      // Still mark market as liquidated
      await supabase
        .from('markets')
        .update({ status: 'liquidado' })
        .eq('id', marketId);

      return new Response(JSON.stringify({
        success: true,
        message: 'Market liquidated (no active orders)',
        preview: {
          marketId,
          winningOption,
          totalPool: 0,
          winningPool: 0,
          losingPool: 0,
          platformFee: 0,
          profitPool: 0,
          effectiveMultiplier: 1,
          winningOrders: 0,
          losingOrders: 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate pools and bettors by option
    const poolsByOption: Record<string, number> = {};
    const bettorsByOption: Record<string, number> = {};
    let totalPool = 0;

    // Initialize all options
    market.opcoes.forEach((option: string) => {
      poolsByOption[option] = 0;
      bettorsByOption[option] = 0;
    });

    // Calculate pools
    for (const order of orders) {
      const option = order.opcao_escolhida;
      const amount = order.quantidade_moeda;
      
      if (poolsByOption.hasOwnProperty(option)) {
        poolsByOption[option] += amount;
        bettorsByOption[option]++;
        totalPool += amount;
      }
    }

    console.log(`Pools calculated:`, poolsByOption);
    console.log(`Total pool: ${totalPool}`);

    const winningPool = poolsByOption[winningOption] || 0;
    const losingPools = Object.entries(poolsByOption)
      .filter(([option]) => option !== winningOption)
      .map(([, pool]) => pool);
    const totalLosingPool = losingPools.reduce((sum, pool) => sum + pool, 0);

    // Apply universal pari-passu formula for multi-option markets
    // Fee is calculated on the losing pools only
    const platformFee = totalLosingPool * feePercent;
    const profitPool = totalLosingPool - platformFee;
    
    // Effective multiplier for winners
    const effectiveMultiplier = winningPool > 0 ? (winningPool + profitPool) / winningPool : 1;

    const winningOrders = orders.filter(o => o.opcao_escolhida === winningOption);
    const losingOrders = orders.filter(o => o.opcao_escolhida !== winningOption);

    console.log(`Winning pool: ${winningPool}, Losing pool: ${totalLosingPool}`);
    console.log(`Platform fee: ${platformFee}, Profit pool: ${profitPool}`);
    console.log(`Effective multiplier: ${effectiveMultiplier}`);

    // Process winning orders (credit winnings to wallets)
    for (const order of winningOrders) {
      const payout = order.quantidade_moeda * effectiveMultiplier;
      
      console.log(`Processing winning order ${order.id}: ${order.quantidade_moeda} -> ${payout}`);

      // Update user balance using RPC for atomic operation
      const { error: balanceUpdateError } = await supabase
        .rpc('update_user_balance', {
          user_id: order.user_id,
          amount: payout
        });

      if (balanceUpdateError) {
        console.error(`Failed to update wallet for user ${order.user_id}:`, balanceUpdateError);
        throw balanceUpdateError;
      }

      // Create wallet transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          id: `liquidation_${order.id}_${Date.now()}`,
          user_id: order.user_id,
          tipo: 'credito',
          valor: Math.round(payout),
          descricao: `Liquidação mercado: ${market.titulo} (${winningOption})`,
          market_id: marketId
        });

      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'ganha' })
        .eq('id', order.id);
    }

    // Update losing orders status
    for (const order of losingOrders) {
      await supabase
        .from('orders')
        .update({ status: 'perdida' })
        .eq('id', order.id);
    }

    // Handle platform fee distribution (credit to admin)
    if (platformFee > 0) {
      // Find an admin user for fee distribution
      const { data: adminUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_admin', true)
        .limit(1)
        .single();

      if (adminUser) {
        const { error: adminUpdateError } = await supabase
          .rpc('update_user_balance', {
            user_id: adminUser.id,
            amount: Math.round(platformFee)
          });

        if (adminUpdateError) {
          console.error('Failed to credit platform fee to admin:', adminUpdateError);
        } else {
          await supabase
            .from('wallet_transactions')
            .insert({
              id: `fee_${marketId}_${Date.now()}`,
              user_id: adminUser.id,
              tipo: 'credito',
              valor: Math.round(platformFee),
              descricao: `Taxa de liquidação: ${market.titulo}`,
              market_id: marketId
            });
        }
      }
    }

    // Update market status
    await supabase
      .from('markets')
      .update({ status: 'liquidado' })
      .eq('id', marketId);

    // Create result record
    await supabase
      .from('results')
      .insert({
        market_id: marketId,
        resultado_vencedor: winningOption,
        tx_executada: true
      });

    const preview: LiquidationPreview = {
      marketId,
      winningOption,
      totalPool,
      winningPool,
      losingPool: totalLosingPool,
      platformFee,
      profitPool,
      effectiveMultiplier,
      winningOrders: winningOrders.length,
      losingOrders: losingOrders.length
    };

    console.log(`Liquidation completed successfully:`, preview);

    return new Response(JSON.stringify({
      success: true,
      message: 'Market liquidated successfully',
      preview
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Liquidation error:', error);
    
    return new Response(JSON.stringify({
      error: (error as Error).message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});