import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    console.log('Processing payout for pool:', poolId, 'result:', result);

    // Process each winning bet
    for (const bet of winningBets) {
      const payoutAmount = Math.floor(bet.amount_rioz * bet.odds);
      
      // Update user balance
      const { error: balanceError } = await supabaseClient.rpc('increment_balance', {
        user_id: bet.user_id,
        amount: payoutAmount
      });

      if (balanceError) {
        console.error('Error updating balance for user:', bet.user_id, balanceError);
        continue;
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

    return new Response(
      JSON.stringify({ success: true, processed: winningBets.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing payouts:', error);
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