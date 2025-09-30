import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    );

    const { poolId, result, winningBets } = await req.json();

    console.log('Processing pool result and payouts for pool:', poolId, 'result:', result);

    // Process each winning bet with proper crediting
    for (const bet of winningBets) {
      const payoutAmount = Math.floor(bet.amount_rioz * bet.odds);
      
      // Update user balance - credit the winnings
      const { error: balanceError } = await supabaseClient.rpc('increment_balance', {
        user_id: bet.user_id,
        amount: payoutAmount
      });

      if (balanceError) {
        console.error('Error updating balance for user:', bet.user_id, balanceError);
        continue;
      }

      // Register winning transaction in wallet_transactions
      const { error: transactionError } = await supabaseClient
        .from('wallet_transactions')
        .insert({
          id: `fast_win_${poolId}_${bet.id}_${Date.now()}`,
          user_id: bet.user_id,
          tipo: 'credito',
          valor: payoutAmount,
          descricao: `Fast Market - Vitória - ${bet.side === 'subiu' ? 'Subiu' : 'Desceu'}`,
          market_id: poolId
        });

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError);
      }

      // Mark bet as processed with payout amount
      const { error: betError } = await supabaseClient
        .from('fast_pool_bets')
        .update({ 
          processed: true, 
          payout_amount: payoutAmount 
        })
        .eq('id', bet.id);

      if (betError) {
        console.error('Error updating bet:', bet.id, betError);
      }

      console.log(`Paid ${payoutAmount} RZ to user ${bet.user_id} for bet ${bet.id}`);
    }

    // Store the result in fast_pool_results for all categories
    const { data: pool } = await supabaseClient
      .from('fast_pools')
      .select('*')
      .eq('id', poolId)
      .single();

    if (pool) {
      await supabaseClient
        .from('fast_pool_results')
        .insert({
          pool_id: poolId,
          asset_symbol: pool.asset_symbol,
          opening_price: pool.opening_price,
          closing_price: pool.closing_price,
          price_change_percent: ((pool.closing_price - pool.opening_price) / pool.opening_price) * 100,
          result: result,
          total_bets_subiu: 0, // These will be calculated separately
          total_bets_desceu: 0,
          winners_count: winningBets.length,
          total_payout: winningBets.reduce((sum: number, bet: any) => sum + (bet.amount_rioz * bet.odds), 0)
        });
    }

    return new Response(
      JSON.stringify({ success: true, processed: winningBets.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing pool result:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});