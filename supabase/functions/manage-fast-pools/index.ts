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
      case 'adjust_opening_price':
        const { poolId: adjustPoolId } = requestBody;
        return await adjustOpeningPrice(supabase, adjustPoolId);
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

  // If we don't have 3 active pools for this category, check if we need to create pools for ALL categories
  if (validPools.length < 3) {
    // Check if ANY category has active pools
    const { data: allActivePools } = await supabase
      .from('fast_pools')
      .select('category, round_end_time')
      .eq('status', 'active')
      .eq('paused', false);
    
    const hasActivePoolsInAnyCategory = allActivePools?.some((pool: any) => 
      new Date(pool.round_end_time) > now
    );
    
    // If no category has active pools, create synchronized pools for ALL categories
    if (!hasActivePoolsInAnyCategory) {
      await createAllCategoriesPools(supabase);
      
      // Fetch the newly created pools for this category
      const { data: newPools } = await supabase
        .from('fast_pools')
        .select('*')
        .eq('status', 'active')
        .eq('category', category)
        .eq('paused', false)
        .order('created_at', { ascending: false })
        .limit(3);
      
      activePools = newPools || [];
    } else {
      // Some category has active pools, just create for this category
      activePools = await createSynchronizedPools(supabase, category);
    }
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
  // Get algorithm configuration
  const { data: algorithmConfig } = await supabase
    .from('fast_pool_algorithm_config')
    .select('pool_duration_seconds, odds_start, odds_end, odds_curve_intensity, lockout_time_seconds, max_odds, min_odds, algorithm_type, algo2_odds_high, algo2_odds_low')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  
  const poolDuration = algorithmConfig?.pool_duration_seconds || 60;
  
  // Get pool configurations with custom names
  const poolConfigs = await getPoolConfigurationsWithCustomNames(supabase, category);
  
  // Get symbols for price fetch
  const symbols = poolConfigs.map(config => config.symbol);
  
  // Create pools with timing FIRST, then update prices immediately
  const now = new Date();
  const endTime = new Date(now.getTime() + (poolDuration * 1000));

  // Get current round number
  const { data: lastPool } = await supabase
    .from('fast_pools')
    .select('round_number')
    .order('round_number', { ascending: false })
    .limit(1);

  const nextRoundNumber = (lastPool?.[0]?.round_number || 0) + 1;

  // Use algorithm base_odds if available, otherwise default
  const baseOdds = algorithmConfig?.odds_start || 1.65;

  // Create all 3 pools with synchronized timing and temporary fallback prices
  const poolsToInsert = poolConfigs.map((config, index) => ({
    round_number: nextRoundNumber,
    asset_symbol: config.symbol,
    asset_name: config.name,
    question: config.question,
    category: category,
    opening_price: config.fallbackPrice, // Temporary fallback price
    round_start_time: now.toISOString(),
    round_end_time: endTime.toISOString(),
    base_odds: baseOdds,
    status: 'active',
    paused: false
  }));

  const { data: pools, error } = await supabase
    .from('fast_pools')
    .insert(poolsToInsert)
    .select();

  if (error) throw error;

  // IMMEDIATELY after creating pools, get real-time prices
  console.log('📊 Fetching real-time prices for pools...');
  const { data: marketData } = await supabase.functions.invoke('get-market-data', {
    body: { symbols }
  });

  const prices = marketData?.prices || {};
  
  // Update each pool with the real-time price immediately
  for (const pool of pools) {
    const realPrice = prices[pool.asset_symbol];
    if (realPrice) {
      await supabase
        .from('fast_pools')
        .update({ opening_price: realPrice })
        .eq('id', pool.id);
      
      console.log(`✅ Pool ${pool.id} (${pool.asset_symbol}) opening_price set to ${realPrice} (real-time)`);
    } else {
      console.log(`⚠️ Pool ${pool.id} (${pool.asset_symbol}) using fallback price ${pool.opening_price}`);
    }
  }

  return pools;
}

async function getPoolConfigurationsWithCustomNames(supabase: any, category: string) {
  // Get custom configurations from database
  const { data: configs } = await supabase
    .from('fast_pool_configs')
    .select('asset_symbol, asset_name, question')
    .eq('category', category);
  
  const configMap = new Map();
  (configs || []).forEach((config: any) => {
    configMap.set(config.asset_symbol, {
      name: config.asset_name,
      question: config.question
    });
  });
  
  // Get default configurations and override with custom ones
  const defaultConfigs = getPoolConfigurations(category);
  return defaultConfigs.map(config => ({
    ...config,
    name: configMap.get(config.symbol)?.name || config.name,
    question: configMap.get(config.symbol)?.question || config.question
  }));
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

  // Get closing price IMMEDIATELY for this specific asset
  const { data: marketData } = await supabase.functions.invoke('get-market-data', {
    body: { symbols: [pool.asset_symbol] }
  });
  
  const closingPrice = marketData?.prices?.[pool.asset_symbol] || getFallbackPriceForSymbol(pool.asset_symbol);

  console.log(`Pool ${poolId} - Opening: ${pool.opening_price}, Closing: ${closingPrice}`);

  // Determine result based on price comparison
  // "manteve" only if prices are exactly equal (to the cent)
  const priceChange = ((closingPrice - pool.opening_price) / pool.opening_price) * 100;
  let result: string;
  
  if (closingPrice === pool.opening_price) {
    result = 'manteve';
  } else if (closingPrice > pool.opening_price) {
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

async function adjustOpeningPrice(supabase: any, poolId: string) {
  // Get pool data
  const { data: pool, error: poolError } = await supabase
    .from('fast_pools')
    .select('asset_symbol, round_start_time')
    .eq('id', poolId)
    .single();

  if (poolError) throw poolError;
  if (!pool) throw new Error('Pool not found');

  // Check if pool is still within first 3 seconds
  const startTime = new Date(pool.round_start_time).getTime();
  const now = Date.now();
  const elapsedSinceStart = (now - startTime) / 1000; // seconds

  if (elapsedSinceStart > 3) {
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Pool is already past the 3-second adjustment window'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // Get current real-time price for this asset
  const { data: marketData } = await supabase.functions.invoke('get-market-data', {
    body: { symbols: [pool.asset_symbol] }
  });
  
  const currentPrice = marketData?.prices?.[pool.asset_symbol] || getFallbackPriceForSymbol(pool.asset_symbol);

  console.log(`🔄 Adjusting opening price for pool ${poolId} to ${currentPrice} (${elapsedSinceStart.toFixed(2)}s elapsed)`);

  // Update the opening price to the current real-time price
  const { error: updateError } = await supabase
    .from('fast_pools')
    .update({
      opening_price: currentPrice
    })
    .eq('id', poolId);

  if (updateError) throw updateError;

  return new Response(
    JSON.stringify({ 
      success: true,
      pool_id: poolId,
      new_opening_price: currentPrice,
      elapsed_seconds: elapsedSinceStart
    }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

async function createAllCategoriesPools(supabase: any) {
  const categories = ['commodities', 'crypto', 'forex', 'stocks'];
  
  // Get algorithm configuration
  const { data: algorithmConfig } = await supabase
    .from('fast_pool_algorithm_config')
    .select('pool_duration_seconds, odds_start, odds_end, odds_curve_intensity, lockout_time_seconds, max_odds, min_odds, algorithm_type, algo2_odds_high, algo2_odds_low')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  
  const poolDuration = algorithmConfig?.pool_duration_seconds || 60;
  
  // Collect all symbols first
  const allSymbols: string[] = [];
  for (const category of categories) {
    const poolConfigs = getPoolConfigurations(category);
    poolConfigs.forEach(config => allSymbols.push(config.symbol));
  }
  
  // Create pools with timing FIRST
  const now = new Date();
  const endTime = new Date(now.getTime() + (poolDuration * 1000));

  // Get current round number
  const { data: lastPool } = await supabase
    .from('fast_pools')
    .select('round_number')
    .order('round_number', { ascending: false })
    .limit(1);

  const nextRoundNumber = (lastPool?.[0]?.round_number || 0) + 1;

  // Collect all pool configurations
  const allPoolsToInsert = [];

  // Get all custom configurations from database
  const { data: customConfigs } = await supabase
    .from('fast_pool_configs')
    .select('asset_symbol, asset_name, question, category');
  
  const configMap = new Map();
  (customConfigs || []).forEach((config: any) => {
    configMap.set(`${config.category}-${config.asset_symbol}`, {
      name: config.asset_name,
      question: config.question
    });
  });
  
  // Use algorithm base_odds if available, otherwise default
  const baseOdds = algorithmConfig?.odds_start || 1.65;

  // Create pools for all categories with same timing and temporary fallback prices
  for (const category of categories) {
    const poolConfigs = getPoolConfigurations(category);
    
    for (const config of poolConfigs) {
      const customConfig = configMap.get(`${category}-${config.symbol}`);
      allPoolsToInsert.push({
        round_number: nextRoundNumber,
        asset_symbol: config.symbol,
        asset_name: customConfig?.name || config.name,
        question: customConfig?.question || config.question,
        category: category,
        opening_price: config.fallbackPrice, // Temporary fallback price
        round_start_time: now.toISOString(),
        round_end_time: endTime.toISOString(),
        base_odds: baseOdds,
        status: 'active',
        paused: false
      });
    }
  }

  // Insert all pools at once
  const { data: pools, error } = await supabase
    .from('fast_pools')
    .insert(allPoolsToInsert)
    .select();

  if (error) {
    console.error('Error creating all category pools:', error);
    throw error;
  }

  // IMMEDIATELY after creating pools, get real-time prices for all symbols
  console.log('📊 Fetching real-time prices for all pools...');
  const { data: marketData } = await supabase.functions.invoke('get-market-data', {
    body: { symbols: allSymbols }
  });

  const prices = marketData?.prices || {};
  
  // Update each pool with the real-time price immediately
  for (const pool of pools) {
    const realPrice = prices[pool.asset_symbol];
    if (realPrice) {
      await supabase
        .from('fast_pools')
        .update({ opening_price: realPrice })
        .eq('id', pool.id);
      
      console.log(`✅ Pool ${pool.id} (${pool.asset_symbol}) opening_price set to ${realPrice} (real-time)`);
    } else {
      console.log(`⚠️ Pool ${pool.id} (${pool.asset_symbol}) using fallback price ${pool.opening_price}`);
    }
  }

  console.log(`Created ${pools?.length} pools across all categories with real-time prices`);
  return pools;
}