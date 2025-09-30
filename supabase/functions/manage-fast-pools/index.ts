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

    const requestBody = await req.json();
    const { action } = requestBody;

    switch (action) {
      case 'get_current_pool':
        const { category: getCategory } = requestBody;
        return await getCurrentPool(supabase, getCategory);
      case 'create_new_pool':
        const { category: createCategory } = requestBody;
        return await createNewPool(supabase, createCategory);
      case 'finalize_pool':
        const { poolId } = requestBody;
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

async function getCurrentPool(supabase: any, category = 'crypto') {
  // Get all active pools for selected category (excluding paused pools)
  const { data: pools, error } = await supabase
    .from('fast_pools')
    .select('*')
    .eq('status', 'active')
    .eq('category', category)
    .eq('paused', false)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Check if we have all 3 pools active and not expired
  const now = new Date();
  const validPools = pools?.filter((pool: any) => new Date(pool.round_end_time) > now) || [];

  let activePools = validPools;

  // If we don't have 3 active pools, create new synchronized set
  if (validPools.length < 3) {
    activePools = await createSynchronizedPools(supabase, category);
  }

  return new Response(
    JSON.stringify({ pools: activePools }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

async function createNewPool(supabase: any, category = 'crypto') {
  const newPools = await createSynchronizedPools(supabase, category);
  
  return new Response(
    JSON.stringify({ pools: newPools }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

async function createSynchronizedPools(supabase: any, category = 'crypto') {
  const now = new Date();
  const endTime = new Date(now.getTime() + 60000); // 60 seconds from now

  // Get current round number
  const { data: lastPool } = await supabase
    .from('fast_pools')
    .select('round_number')
    .order('round_number', { ascending: false })
    .limit(1);

  const nextRoundNumber = (lastPool?.[0]?.round_number || 0) + 1;

  // Define pool configurations for each category
  const poolConfigs = getPoolConfigurations(category);
  
  // Get real market prices for all symbols
  const symbols = poolConfigs.map(config => config.symbol);
  const { data: marketData } = await supabase.functions.invoke('get-market-data', {
    body: { symbols }
  });

  const prices = marketData?.prices || {};

  // Create all 3 pools with synchronized timing
  const poolsToInsert = poolConfigs.map((config, index) => ({
    round_number: nextRoundNumber,
    asset_symbol: config.symbol,
    asset_name: config.name,
    question: config.question,
    category: category,
    opening_price: prices[config.symbol] || config.fallbackPrice,
    round_start_time: now.toISOString(),
    round_end_time: endTime.toISOString(),
    base_odds: 1.65,
    status: 'active',
    paused: false
  }));

  const { data: pools, error } = await supabase
    .from('fast_pools')
    .insert(poolsToInsert)
    .select();

  if (error) throw error;

  return pools;
}

function getPoolConfigurations(category: string) {
  const configs = {
    commodities: [
      { symbol: 'OIL', name: 'Petróleo WTI', question: 'O petróleo vai subir nos próximos 60 segundos?', fallbackPrice: 75.50 },
      { symbol: 'GOLD', name: 'Ouro', question: 'O ouro vai subir nos próximos 60 segundos?', fallbackPrice: 2650.00 },
      { symbol: 'SILVER', name: 'Prata', question: 'A prata vai subir nos próximos 60 segundos?', fallbackPrice: 31.25 }
    ],
    crypto: [
      { symbol: 'BTC', name: 'Bitcoin', question: 'O Bitcoin vai subir nos próximos 60 segundos?', fallbackPrice: 67500 },
      { symbol: 'ETH', name: 'Ethereum', question: 'O Ethereum vai subir nos próximos 60 segundos?', fallbackPrice: 3250 },
      { symbol: 'SOL', name: 'Solana', question: 'O Solana vai subir nos próximos 60 segundos?', fallbackPrice: 140 }
    ],
    forex: [
      { symbol: 'BRLUSD', name: 'Real/Dólar', question: 'O Real vai subir contra o Dólar nos próximos 60 segundos?', fallbackPrice: 0.20 },
      { symbol: 'EURUSD', name: 'Euro/Dólar', question: 'O Euro vai subir contra o Dólar nos próximos 60 segundos?', fallbackPrice: 1.09 },
      { symbol: 'JPYUSD', name: 'Iene/Dólar', question: 'O Iene vai subir contra o Dólar nos próximos 60 segundos?', fallbackPrice: 0.0067 }
    ],
    stocks: [
      { symbol: 'TSLA', name: 'Tesla', question: 'A Tesla vai subir nos próximos 60 segundos?', fallbackPrice: 248.50 },
      { symbol: 'AAPL', name: 'Apple', question: 'A Apple vai subir nos próximos 60 segundos?', fallbackPrice: 225.75 },
      { symbol: 'AMZN', name: 'Amazon', question: 'A Amazon vai subir nos próximos 60 segundos?', fallbackPrice: 185.25 }
    ]
  };

  return configs[category as keyof typeof configs] || configs.crypto;
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

  // Get current price for this specific asset
  const { data: marketData } = await supabase.functions.invoke('get-market-data', {
    body: { symbols: [pool.asset_symbol] }
  });
  
  const closingPrice = marketData?.prices?.[pool.asset_symbol] || getFallbackPriceForSymbol(pool.asset_symbol);

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
    // Call the comprehensive result processing function
    const { error: payoutError } = await supabase.functions.invoke('process-fast-pool-result', {
      body: {
        poolId: poolId,
        result: result,
        winningBets: winningBets
      }
    });
    
    if (payoutError) {
      console.error('Error processing result and payouts:', payoutError);
    } else {
      console.log(`Processed ${winningBets.length} winning bets for pool ${poolId}`);
    }
  } else if (result === 'manteve') {
    // If price maintained, refund all bets
    for (const bet of bets || []) {
      const { error: refundError } = await supabase.rpc('increment_balance', {
        user_id: bet.user_id,
        amount: bet.amount_rioz
      });
      
      if (refundError) {
        console.error('Error processing refund for user:', bet.user_id, refundError);
      }
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

function getFallbackPriceForSymbol(symbol: string): number {
  const fallbackPrices = {
    'BTC': 67500,
    'ETH': 3250,
    'SOL': 140,
    'OIL': 75.50,
    'GOLD': 2650.00,
    'SILVER': 31.25,
    'BRLUSD': 0.20,
    'EURUSD': 1.09,
    'JPYUSD': 0.0067,
    'TSLA': 248.50,
    'AAPL': 225.75,
    'AMZN': 185.25
  };
  return fallbackPrices[symbol as keyof typeof fallbackPrices] || 100;
}