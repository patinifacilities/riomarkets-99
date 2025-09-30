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
    const { asset_symbol, limit = 10 } = await req.json();
    
    console.log('Getting fast pool history for asset:', asset_symbol);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get recent results for the asset
    const { data: results, error } = await supabase
      .from('fast_pool_results')
      .select(`
        *,
        fast_pools!inner(
          asset_name,
          question,
          category,
          round_start_time
        )
      `)
      .eq('asset_symbol', asset_symbol)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Format results for frontend
    const formattedResults = results.map(result => ({
      id: result.id,
      result: result.result,
      price_change_percent: result.price_change_percent,
      opening_price: result.opening_price,
      closing_price: result.closing_price,
      created_at: result.created_at,
      asset_name: result.fast_pools.asset_name,
      question: result.fast_pools.question,
      category: result.fast_pools.category,
      round_start_time: result.fast_pools.round_start_time,
      winners_count: result.winners_count,
      total_payout: result.total_payout
    }));

    console.log('Found history results:', formattedResults.length);

    return new Response(JSON.stringify({
      success: true,
      results: formattedResults,
      asset_symbol
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-fast-pool-history function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      details: 'Failed to get fast pool history'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});