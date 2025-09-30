import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pool_id } = await req.json();
    
    if (!pool_id) {
      throw new Error('Missing pool_id parameter');
    }

    console.log('Processing fast results for pool:', pool_id);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pool details
    const { data: pool, error: poolError } = await supabase
      .from('fast_pools')
      .select('*')
      .eq('id', pool_id)
      .single();

    if (poolError || !pool) {
      throw new Error('Pool not found');
    }

    // Check if pool has already been processed
    if (pool.status === 'completed') {
      console.log('Pool already processed');
      return new Response(JSON.stringify({
        success: true,
        message: 'Pool already processed',
        result: pool.result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set pool to processing status
    await supabase
      .from('fast_pools')
      .update({ status: 'processing' })
      .eq('id', pool_id);

    // Get current market price for the asset (mock for now - can be replaced with real API)
    const mockPriceChanges = {
      'OIL_WTI': Math.random() * 4 - 2, // -2% to +2%
      'GOLD': Math.random() * 2 - 1, // -1% to +1%
      'SILVER': Math.random() * 6 - 3, // -3% to +3%
      'BTC_USD': Math.random() * 10 - 5, // -5% to +5%
      'ETH_USD': Math.random() * 8 - 4, // -4% to +4%
      'SOL_USD': Math.random() * 12 - 6, // -6% to +6%
      'USD_BRL': Math.random() * 2 - 1, // -1% to +1%
      'EUR_USD': Math.random() * 1.5 - 0.75, // -0.75% to +0.75%
      'GBP_USD': Math.random() * 2 - 1, // -1% to +1%
      'AAPL': Math.random() * 6 - 3, // -3% to +3%
      'MSFT': Math.random() * 5 - 2.5, // -2.5% to +2.5%
      'TSLA': Math.random() * 8 - 4 // -4% to +4%
    };

    const priceChangePercent = mockPriceChanges[pool.asset_symbol as keyof typeof mockPriceChanges] || 0;
    const closingPrice = pool.opening_price * (1 + priceChangePercent / 100);

    // Determine the result
    let result: string;
    if (Math.abs(priceChangePercent) < 0.1) { // Less than 0.1% change is "manteve"
      result = 'manteve';
    } else if (priceChangePercent > 0) {
      result = 'subiu';
    } else {
      result = 'desceu';
    }

    console.log('Price change:', priceChangePercent, '% - Result:', result);

    // Update pool with results
    await supabase
      .from('fast_pools')
      .update({
        closing_price: closingPrice,
        result,
        status: 'completed'
      })
      .eq('id', pool_id);

    // Get all bets for this pool
    const { data: bets, error: betsError } = await supabase
      .from('fast_pool_bets')
      .select('*')
      .eq('pool_id', pool_id)
      .eq('processed', false);

    if (betsError) {
      throw betsError;
    }

    // Process winning bets
    let totalWinners = 0;
    let totalPayout = 0;
    let totalBetsSubiu = 0;
    let totalBetsDesceu = 0;

    // Calculate total bet amounts by side
    for (const bet of bets) {
      if (bet.side === 'subiu') {
        totalBetsSubiu += bet.amount_rioz;
      } else if (bet.side === 'desceu') {
        totalBetsDesceu += bet.amount_rioz;
      }
    }

    // Process each bet
    for (const bet of bets) {
      let payout = 0;
      
      if (bet.side === result) {
        // Winner! Calculate payout
        payout = Math.floor(bet.amount_rioz * bet.odds);
        totalWinners++;
        totalPayout += payout;

        // Update user balance
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('saldo_moeda')
          .eq('id', bet.user_id)
          .single();

        if (profile && !profileError) {
          await supabase
            .from('profiles')
            .update({ saldo_moeda: profile.saldo_moeda + payout })
            .eq('id', bet.user_id);

          // Create winning transaction
          await supabase
            .from('wallet_transactions')
            .insert({
              id: `fast_win_${bet.id}_${Date.now()}`,
              user_id: bet.user_id,
              tipo: 'credito',
              valor: payout,
              descricao: `Fast Market Win - ${pool.asset_name} (${result.toUpperCase()}) - Lucro: ${payout - bet.amount_rioz} RZ`
            });
        }
      }

      // Mark bet as processed
      await supabase
        .from('fast_pool_bets')
        .update({ 
          processed: true,
          payout_amount: payout 
        })
        .eq('id', bet.id);
    }

    // Create result record
    await supabase
      .from('fast_pool_results')
      .insert({
        pool_id,
        asset_symbol: pool.asset_symbol,
        opening_price: pool.opening_price,
        closing_price: closingPrice,
        price_change_percent: priceChangePercent,
        result,
        total_bets_subiu: totalBetsSubiu,
        total_bets_desceu: totalBetsDesceu,
        winners_count: totalWinners,
        total_payout: totalPayout
      });

    console.log('Fast results processed:', {
      result,
      winners: totalWinners,
      totalPayout,
      priceChange: priceChangePercent
    });

    return new Response(JSON.stringify({
      success: true,
      result,
      price_change_percent: priceChangePercent,
      opening_price: pool.opening_price,
      closing_price: closingPrice,
      winners_count: totalWinners,
      total_payout: totalPayout,
      total_bets: bets.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-fast-results function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      details: 'Failed to process fast results'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});