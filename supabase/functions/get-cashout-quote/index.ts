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
    const { order_id } = await req.json();
    
    if (!order_id) {
      throw new Error('order_id is required');
    }

    console.log('Getting cashout quote for order:', order_id);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('status', 'ativa')
      .single();

    if (orderError || !order) {
      throw new Error('Order not found or not active');
    }

    // Get settings for cashout fee
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();

    const cashoutFeePercent = settings?.cashout_fee_percent || 0.02;

    // Calculate current pools and rewards for this market
    const poolsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/calc-pools-with-rewards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({ market_id: order.market_id })
    });

    if (!poolsResponse.ok) {
      throw new Error('Failed to calculate current pools');
    }

    const poolsData = await poolsResponse.json();
    
    // Find the reward for the user's chosen option
    const userOption = poolsData.options.find((opt: any) => opt.label === order.opcao_escolhida);
    
    if (!userOption) {
      throw new Error('User option not found in pool calculation');
    }

    const multipleNow = userOption.recompensa || 1;
    const gross = order.quantidade_moeda * multipleNow;
    const fee = gross * cashoutFeePercent;
    const net = Math.max(gross - fee, 0);

    const quote = {
      order_id: order.id,
      market_id: order.market_id,
      opcao_escolhida: order.opcao_escolhida,
      quantidade_original: order.quantidade_moeda,
      multiple_now: multipleNow,
      gross: Math.round(gross * 100) / 100,
      fee: Math.round(fee * 100) / 100,
      net: Math.round(net * 100) / 100,
      cashout_fee_percent: cashoutFeePercent * 100 // Return as percentage
    };

    console.log('Cashout quote calculated:', quote);

    return new Response(JSON.stringify(quote), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-cashout-quote function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      details: 'Failed to get cashout quote'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});