import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );

    const { action } = await req.json();

    switch (action) {
      case 'get_current_pool':
        return await getCurrentPool(supabase);
      case 'create_new_pool':
        return await createNewPool(supabase);
      case 'finalize_pool':
        const { poolId } = await req.json();
        return await finalizePool(supabase, poolId);
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function getCurrentPool(supabase: any) {
  // Get the most recent active pool
  const { data: pools, error } = await supabase
    .from('fast_pools')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  let currentPool = pools?.[0];

  // If no active pool exists or current pool is expired, create a new one
  if (!currentPool || new Date(currentPool.round_end_time) <= new Date()) {
    currentPool = await createPool(supabase);
  }

  return new Response(
    JSON.stringify({ pool: currentPool }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

async function createNewPool(supabase: any) {
  const newPool = await createPool(supabase);
  
  return new Response(
    JSON.stringify({ pool: newPool }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

async function createPool(supabase: any) {
  const now = new Date();
  const endTime = new Date(now.getTime() + 60000); // 60 seconds from now

  // Get current round number
  const { data: lastPool } = await supabase
    .from('fast_pools')
    .select('round_number')
    .order('round_number', { ascending: false })
    .limit(1);

  const nextRoundNumber = (lastPool?.[0]?.round_number || 0) + 1;

  // Get current BTC price
  const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const priceData = await priceResponse.json();
  const currentPrice = priceData.bitcoin?.usd || 43000;

  const poolData = {
    round_number: nextRoundNumber,
    asset_symbol: 'BTC',
    asset_name: 'Bitcoin',
    question: 'O Bitcoin vai subir nos próximos 60 segundos?',
    category: 'crypto',
    opening_price: currentPrice,
    round_start_time: now.toISOString(),
    round_end_time: endTime.toISOString(),
    base_odds: 1.65,
    status: 'active'
  };

  const { data: pool, error } = await supabase
    .from('fast_pools')
    .insert(poolData)
    .select()
    .single();

  if (error) throw error;

  return pool;
}

async function finalizePool(supabase: any, poolId: string) {
  // Get pool data
  const { data: pool, error: poolError } = await supabase
    .from('fast_pools')
    .select('*')
    .eq('id', poolId)
    .single();

  if (poolError) throw poolError;
  if (!pool) throw new Error('Pool not found');

  // Get current price
  const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const priceData = await priceResponse.json();
  const closingPrice = priceData.bitcoin?.usd || 43000;

  // Determine result
  const priceChange = ((closingPrice - pool.opening_price) / pool.opening_price) * 100;
  let result: string;
  
  if (Math.abs(priceChange) < 0.01) { // Less than 0.01% change
    result = 'manteve';
  } else if (priceChange > 0) {
    result = 'subiu';
  } else {
    result = 'desceu';
  }

  // Update pool with result
  const { error: updateError } = await supabase
    .from('fast_pools')
    .update({
      closing_price: closingPrice,
      result: result,
      status: 'completed'
    })
    .eq('id', poolId);

  if (updateError) throw updateError;

  // Get all bets for this pool
  const { data: bets, error: betsError } = await supabase
    .from('fast_pool_bets')
    .select('*')
    .eq('pool_id', poolId)
    .eq('processed', false);

  if (betsError) throw betsError;

  // Process payouts for winners
  let totalPayout = 0;
  let winnersCount = 0;
  let totalBetsSubiu = 0;
  let totalBetsDesceu = 0;

  for (const bet of bets || []) {
    if (bet.side === 'subiu') totalBetsSubiu += bet.amount_rioz;
    if (bet.side === 'desceu') totalBetsDesceu += bet.amount_rioz;
  }

  // Get winning bets and process payouts
  const winningBets = (bets || []).filter((bet: any) => bet.side === result);
  
  if (winningBets.length > 0) {
    // Call the payout processing function
    const { error: payoutError } = await supabase.functions.invoke('process-fast-pool-payout', {
      body: {
        poolId: poolId,
        result: result,
        winningBets: winningBets
      }
    });
    
    if (payoutError) {
      console.error('Error processing payouts:', payoutError);
    } else {
      console.log(`Processed ${winningBets.length} winning bets for pool ${poolId}`);
    }
  }

  // Calculate totals
  winnersCount = winningBets.length;
  totalPayout = winningBets.reduce((sum: number, bet: any) => sum + (bet.amount_rioz * bet.odds), 0);

  // Mark all bets as processed
  for (const bet of bets || []) {
    const isWinner = bet.side === result;
    await supabase
      .from('fast_pool_bets')
      .update({
        payout_amount: isWinner ? bet.amount_rioz * bet.odds : 0,
        processed: true
      })
      .eq('id', bet.id);
  }

  // Save result data
  await supabase
    .from('fast_pool_results')
    .insert({
      pool_id: poolId,
      asset_symbol: pool.asset_symbol,
      opening_price: pool.opening_price,
      closing_price: closingPrice,
      price_change_percent: priceChange,
      result: result,
      total_bets_subiu: totalBetsSubiu,
      total_bets_desceu: totalBetsDesceu,
      winners_count: winnersCount,
      total_payout: totalPayout
    });

  return new Response(
    JSON.stringify({ 
      success: true,
      result: {
        pool_id: poolId,
        opening_price: pool.opening_price,
        closing_price: closingPrice,
        price_change_percent: priceChange,
        result: result,
        winners_count: winnersCount,
        total_payout: totalPayout
      }
    }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

async function updateUserBalance(supabase: any, userId: string, amount: number) {
  // Update user's RIOZ balance
  const { error } = await supabase.rpc('increment_balance', {
    user_id: userId,
    amount: Math.floor(amount)
  });

  if (error) {
    console.error('Error updating user balance:', error);
  }
}