import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepthPoint {
  price: number;
  cumulative_quantity: number;
  side: 'buy' | 'sell';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('Fetching orderbook depth data...');

    // Get extended orderbook levels for depth chart
    const { data: buyLevels, error: buyError } = await supabase
      .from('orderbook_levels')
      .select('price, quantity')
      .eq('symbol', 'RIOZBRL')
      .eq('side', 'buy')
      .order('price', { ascending: false })
      .limit(50);

    const { data: sellLevels, error: sellError } = await supabase
      .from('orderbook_levels')
      .select('price, quantity')
      .eq('symbol', 'RIOZBRL')
      .eq('side', 'sell')
      .order('price', { ascending: true })
      .limit(50);

    if (buyError || sellError) {
      console.error('Error fetching depth data:', buyError || sellError);
      throw buyError || sellError;
    }

    // Process buy side (cumulative from highest to lowest price)
    let cumulativeQty = 0;
    const buyDepth: DepthPoint[] = (buyLevels || []).map(level => {
      cumulativeQty += parseFloat(level.quantity);
      return {
        price: parseFloat(level.price),
        cumulative_quantity: cumulativeQty,
        side: 'buy' as const
      };
    });

    // Process sell side (cumulative from lowest to highest price)
    cumulativeQty = 0;
    const sellDepth: DepthPoint[] = (sellLevels || []).map(level => {
      cumulativeQty += parseFloat(level.quantity);
      return {
        price: parseFloat(level.price),
        cumulative_quantity: cumulativeQty,
        side: 'sell' as const
      };
    });

    const depthData = {
      symbol: 'RIOZBRL',
      buy_depth: buyDepth,
      sell_depth: sellDepth,
      last_updated: new Date().toISOString()
    };

    console.log('Depth data fetched successfully:', {
      buyDepth: buyDepth.length,
      sellDepth: sellDepth.length
    });

    return new Response(JSON.stringify(depthData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-orderbook-depth:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch depth data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});