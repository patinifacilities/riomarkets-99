import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExecuteMarketOrderRequest {
  side: 'buy_rioz' | 'sell_rioz';
  amountInput: number;
  inputCurrency: 'BRL' | 'RIOZ';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { side, amountInput, inputCurrency }: ExecuteMarketOrderRequest = await req.json();

    // Validate input
    if (!side || !amountInput || !inputCurrency) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (amountInput <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be greater than 0' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get current rate
    const { data: rateData, error: rateError } = await supabaseClient
      .from('rates')
      .select('price')
      .eq('symbol', 'RIOZBRL')
      .single();

    if (rateError || !rateData) {
      return new Response(
        JSON.stringify({ error: 'Unable to get current rate' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const currentPrice = rateData.price;

    // Execute market order using the database function
    const { data: executionResult, error: executionError } = await supabaseClient
      .rpc('execute_market_order', {
        p_user_id: user.id,
        p_side: side,
        p_amount_input: amountInput,
        p_input_currency: inputCurrency,
        p_current_price: currentPrice
      });

    if (executionError) {
      console.error('Execution error:', executionError);
      return new Response(
        JSON.stringify({ error: 'Failed to execute order', details: executionError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = executionResult[0];

    if (!result?.success) {
      return new Response(
        JSON.stringify({ error: result?.message || 'Order execution failed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        newRiozBalance: result.new_rioz_balance,
        newBrlBalance: result.new_brl_balance,
        amountConverted: result.amount_converted,
        feeCharged: result.fee_charged,
        executedPrice: currentPrice,
        side: side,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Market order execution error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});