import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefundRequest {
  assetSymbol: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { assetSymbol } = await req.json() as RefundRequest;

    console.log('🔄 Refunding bets for paused asset:', assetSymbol);

    // Get all active pools for this asset
    const { data: activePools, error: poolsError } = await supabase
      .from('fast_pools')
      .select('id')
      .eq('asset_symbol', assetSymbol)
      .eq('status', 'active');

    if (poolsError) throw poolsError;

    if (!activePools || activePools.length === 0) {
      console.log('No active pools found for asset:', assetSymbol);
      return new Response(
        JSON.stringify({ success: true, message: 'No active pools to refund', refundedBets: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const poolIds = activePools.map(p => p.id);
    console.log('Active pool IDs:', poolIds);

    // Get all unprocessed bets for these pools
    const { data: bets, error: betsError } = await supabase
      .from('fast_pool_bets')
      .select('id, user_id, amount_rioz, pool_id')
      .in('pool_id', poolIds)
      .eq('processed', false);

    if (betsError) throw betsError;

    if (!bets || bets.length === 0) {
      console.log('No bets to refund');
      return new Response(
        JSON.stringify({ success: true, message: 'No bets to refund', refundedBets: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${bets.length} bets to refund`);

    let refundedCount = 0;
    let errors: string[] = [];

    // Process refunds for each bet
    for (const bet of bets) {
      try {
        // Return the bet amount to user's balance
        const { error: refundError } = await supabase
          .from('profiles')
          .update({ 
            saldo_moeda: supabase.rpc('increment', { 
              x: bet.amount_rioz 
            }) as any
          })
          .eq('id', bet.user_id);

        if (refundError) {
          // Alternative: Direct increment
          const { data: profile } = await supabase
            .from('profiles')
            .select('saldo_moeda')
            .eq('id', bet.user_id)
            .single();

          if (profile) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ saldo_moeda: profile.saldo_moeda + bet.amount_rioz })
              .eq('id', bet.user_id);

            if (updateError) throw updateError;
          }
        }

        // Mark bet as processed
        const { error: betUpdateError } = await supabase
          .from('fast_pool_bets')
          .update({ 
            processed: true,
            payout_amount: bet.amount_rioz // Refund full amount
          })
          .eq('id', bet.id);

        if (betUpdateError) throw betUpdateError;

        // Create wallet transaction for refund
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: bet.user_id,
            tipo: 'credito',
            valor: bet.amount_rioz,
            descricao: `Reembolso - Pool ${assetSymbol} pausado`,
            market_id: null
          });

        refundedCount++;
        console.log(`✅ Refunded bet ${bet.id}: ${bet.amount_rioz} RZ to user ${bet.user_id}`);
      } catch (error) {
        console.error(`❌ Error refunding bet ${bet.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Bet ${bet.id}: ${errorMessage}`);
      }
    }

    // Pause all active pools for this asset
    const { error: pauseError } = await supabase
      .from('fast_pools')
      .update({ paused: true })
      .in('id', poolIds);

    if (pauseError) {
      console.error('Error pausing pools:', pauseError);
      errors.push(`Pause pools: ${pauseError.message}`);
    }

    console.log(`✅ Refund complete: ${refundedCount} bets refunded, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        refundedBets: refundedCount,
        totalBets: bets.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in refund-paused-pool-bets:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
