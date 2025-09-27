import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const { market_id } = await req.json();
    
    if (!market_id) {
      throw new Error('market_id is required');
    }

    console.log('Calculating pools and rewards for market:', market_id);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get market and settings
    const [marketResult, settingsResult] = await Promise.all([
      supabase.from('markets').select('*').eq('id', market_id).single(),
      supabase.from('settings').select('*').limit(1).single()
    ]);

    if (marketResult.error) {
      throw new Error('Market not found: ' + marketResult.error.message);
    }

    const market = marketResult.data;
    const settings = settingsResult.data || { fee_percent: 0.20 };
    const feePercent = settings.fee_percent || 0.20;

    // Get all active orders for this market
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('market_id', market_id)
      .eq('status', 'ativa');

    if (ordersError) {
      throw new Error('Error fetching orders: ' + ordersError.message);
    }

    // Calculate pools by option
    const poolsByOption: Record<string, number> = {};
    const bettorsByOption: Record<string, Set<string>> = {};
    let totalPool = 0;

    // Initialize options from market
    const options = Array.isArray(market.opcoes) ? market.opcoes : ['sim', 'nao'];
    options.forEach((option: string) => {
      poolsByOption[option] = 0;
      bettorsByOption[option] = new Set();
    });

    // Calculate pools and bettors
    (orders || []).forEach(order => {
      const option = order.opcao_escolhida;
      const amount = order.quantidade_moeda || 0;
      
      if (poolsByOption.hasOwnProperty(option)) {
        poolsByOption[option] += amount;
        bettorsByOption[option].add(order.user_id);
        totalPool += amount;
      }
    });

    // Calculate results for each option
    const results = options.map((option: string) => {
      const pool = poolsByOption[option] || 0;
      const bettors = bettorsByOption[option].size;
      const percent = totalPool > 0 ? Math.round((pool / totalPool) * 100 * 100) / 100 : 0;
      
      // Calculate reward multiplier (recompensa)
      const poolWin = pool;
      const poolLose = totalPool - poolWin;
      const fee = feePercent * poolLose;
      const totalPayout = totalPool - fee;
      const recompensa = poolWin > 0 ? Math.round((totalPayout / poolWin) * 100) / 100 : 1;

      return {
        label: option,
        pool,
        percent,
        bettors,
        recompensa: Math.max(recompensa, 1) // Minimum 1x
      };
    });

    console.log('Pool calculation results:', { 
      market_id, 
      totalPool, 
      results, 
      feePercent 
    });

    return new Response(JSON.stringify({
      market_id,
      total_pool: totalPool,
      fee_percent: feePercent,
      options: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in calc-pools-with-rewards function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      details: 'Failed to calculate pools and rewards'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});