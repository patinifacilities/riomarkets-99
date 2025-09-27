import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ExecutionResult {
  executed_count: number;
  failed_count: number;
  expired_count: number;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate correlation ID
  const correlationId = `exec-limit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  function structuredLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
      operation: 'execute_limit_orders_v2',
      data
    };
    console.log(JSON.stringify(logEntry));
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    structuredLog('info', 'Starting limit orders execution batch');

    // Validate price freshness
    const { data: priceValid, error: priceError } = await supabase
      .rpc('validate_price_freshness', { p_max_age_seconds: 30 });

    if (priceError || !priceValid) {
      structuredLog('warn', 'Price data too old or invalid, skipping execution', { 
        error: priceError?.message,
        priceValid 
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Price data too old for safe execution', 
          correlationId,
          executed: 0,
          failed: 0,
          expired: 0
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get current price
    const { data: ratesData, error: ratesError } = await supabase
      .from('rates')
      .select('price, updated_at')
      .eq('symbol', 'RIOZBRL')
      .single();

    if (ratesError || !ratesData) {
      structuredLog('error', 'Failed to fetch current price', ratesError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch current price', 
          correlationId 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const currentPrice = ratesData.price;
    structuredLog('info', 'Executing limit orders', { 
      currentPrice,
      priceTimestamp: ratesData.updated_at
    });

    // Execute pending limit orders
    const { data: executionResult, error: executionError } = await supabase
      .rpc('execute_pending_limit_orders', { p_current_price: currentPrice });

    if (executionError) {
      structuredLog('error', 'Limit orders execution failed', executionError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to execute limit orders', 
          correlationId,
          details: executionError.message 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const result: ExecutionResult = executionResult[0];
    
    structuredLog('info', 'Limit orders execution completed', {
      ...result,
      currentPrice,
      totalProcessed: result.executed_count + result.failed_count + result.expired_count
    });

    // Log telemetry event
    await supabase.rpc('log_exchange_event', {
      p_user_id: null, // System event
      p_event_type: 'limit_orders_batch_executed',
      p_event_data: {
        ...result,
        currentPrice,
        correlationId,
        priceTimestamp: ratesData.updated_at
      },
      p_correlation_id: correlationId
    });

    return new Response(
      JSON.stringify({
        success: true,
        correlationId,
        ...result,
        currentPrice,
        recommendations: result.failed_count > 0 
          ? ['Review failed orders for insufficient balance or other issues']
          : ['All eligible orders processed successfully']
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    structuredLog('error', 'Limit orders execution exception', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        correlationId 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});