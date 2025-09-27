import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderBookLevel {
  price: number;
  quantity: number;
  total_value: number;
  orders_count: number;
  cumulative_quantity?: number;
}

interface OrderBookData {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spread_percent: number;
  best_bid: number;
  best_ask: number;
  last_price: number;
  last_updated: string;
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

    console.log('Fetching orderbook data...');

    // Get current rate for last price
    const { data: rateData, error: rateError } = await supabase
      .from('rates')
      .select('price, updated_at')
      .eq('symbol', 'RIOZBRL')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateError) {
      console.error('Error fetching rate:', rateError);
      throw rateError;
    }

    const lastPrice = rateData?.price || 5.50;

    // Get orderbook levels
    const { data: buyLevels, error: buyError } = await supabase
      .from('orderbook_levels')
      .select('price, quantity, total_value, orders_count')
      .eq('symbol', 'RIOZBRL')
      .eq('side', 'buy')
      .order('price', { ascending: false })
      .limit(15);

    const { data: sellLevels, error: sellError } = await supabase
      .from('orderbook_levels')
      .select('price, quantity, total_value, orders_count')
      .eq('symbol', 'RIOZBRL')
      .eq('side', 'sell')
      .order('price', { ascending: true })
      .limit(15);

    if (buyError || sellError) {
      console.error('Error fetching orderbook levels:', buyError || sellError);
      throw buyError || sellError;
    }

    // Process and add cumulative quantities
    let cumulativeQty = 0;
    const processedBids = (buyLevels || []).map(level => {
      cumulativeQty += parseFloat(level.quantity);
      return {
        ...level,
        price: parseFloat(level.price),
        quantity: parseFloat(level.quantity),
        total_value: parseFloat(level.total_value),
        cumulative_quantity: cumulativeQty
      };
    });

    cumulativeQty = 0;
    const processedAsks = (sellLevels || []).map(level => {
      cumulativeQty += parseFloat(level.quantity);
      return {
        ...level,
        price: parseFloat(level.price),
        quantity: parseFloat(level.quantity),
        total_value: parseFloat(level.total_value),
        cumulative_quantity: cumulativeQty
      };
    });

    // Calculate spread and best prices
    const bestBid = processedBids.length > 0 ? processedBids[0].price : lastPrice * 0.999;
    const bestAsk = processedAsks.length > 0 ? processedAsks[0].price : lastPrice * 1.001;
    const spread = bestAsk - bestBid;
    const spreadPercent = (spread / lastPrice) * 100;

    const orderBookData: OrderBookData = {
      symbol: 'RIOZBRL',
      bids: processedBids,
      asks: processedAsks,
      spread: Math.round(spread * 10000) / 10000,
      spread_percent: Math.round(spreadPercent * 100) / 100,
      best_bid: bestBid,
      best_ask: bestAsk,
      last_price: lastPrice,
      last_updated: new Date().toISOString()
    };

    console.log('Orderbook data fetched successfully:', {
      bids: processedBids.length,
      asks: processedAsks.length,
      spread: orderBookData.spread,
      lastPrice
    });

    return new Response(JSON.stringify(orderBookData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-orderbook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch orderbook data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});