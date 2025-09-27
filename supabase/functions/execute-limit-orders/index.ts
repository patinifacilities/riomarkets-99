import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Logger, createCorsHeaders } from '../_shared/logger.ts';
import { executeOrderManually } from './atomic-execution.ts';

const corsHeaders = createCorsHeaders();

const FEE_RATE = 0.02; // 2%
const MAX_ORDERS_PER_EXECUTION = 50; // Process in batches

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const context = Logger.createContext(req, 'execute-limit-orders');
  const logger = new Logger(supabaseUrl, supabaseKey, context);

  let statusCode = 200;
  let error: Error | undefined;
  let processedOrders = 0;

  try {
    const { source, new_price } = await req.json().catch(() => ({ source: 'unknown' }));
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const startTime = Date.now();

    // Get current rate with freshness check
    const { data: rateData, error: rateError } = await supabaseAdmin
      .from('rates')
      .select('price, updated_at')
      .eq('symbol', 'RIOZBRL')
      .single();

    if (rateError || !rateData) {
      throw new Error('Failed to get current rate');
    }

    // Check rate freshness (should not be older than 30 seconds)
    const rateAge = Date.now() - new Date(rateData.updated_at).getTime();
    if (rateAge > 30000) {
      console.warn(`Rate is stale: ${rateAge}ms old`);
    }

    const currentPrice = parseFloat(rateData.price);

    // Find executable limit orders with expiration check
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('exchange_orders')
      .select('*')
      .eq('order_type', 'limit')
      .eq('status', 'pending')
      .or(`and(side.eq.buy_rioz,limit_price.gte.${currentPrice}),and(side.eq.sell_rioz,limit_price.lte.${currentPrice})`)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: true })
      .limit(MAX_ORDERS_PER_EXECUTION);

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      await logger.logMetric({ name: 'limit_orders.executable_found', value: 0 });
      await logger.logRequest(statusCode);
      return new Response(JSON.stringify({ 
        message: 'No executable orders found',
        currentPrice,
        source 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    await logger.logMetric({ name: 'limit_orders.executable_found', value: orders.length });

    // Process each order with proper ACID transaction
    for (const order of orders) {
      const orderStartTime = Date.now();
      let orderSuccess = false;
      
      try {
        const userId = order.user_id;
        const side = order.side;
        const amountRioz = parseFloat(order.amount_rioz);
        const amountBrl = parseFloat(order.amount_brl);
        const limitPrice = parseFloat(order.limit_price);

        // Double-check execution conditions
        const shouldExecute = (
          (side === 'buy_rioz' && currentPrice <= limitPrice) ||
          (side === 'sell_rioz' && currentPrice >= limitPrice)
        );

        if (!shouldExecute) {
          console.log(`Order ${order.id} no longer executable: price=${currentPrice}, limit=${limitPrice}, side=${side}`);
          continue;
        }

        // Check if order is expired
        if (order.expires_at && new Date(order.expires_at) < new Date()) {
          await supabaseAdmin
            .from('exchange_orders')
            .update({ status: 'expired', cancelled_at: new Date().toISOString() })
            .eq('id', order.id);
          continue;
        }

        // Use RPC for atomic execution to ensure ACID compliance
        const { data: executionResult, error: executionError } = await supabaseAdmin
          .rpc('execute_limit_order_atomic', {
            p_order_id: order.id,
            p_current_price: currentPrice
          });

        if (executionError) {
          console.error(`RPC execution failed for order ${order.id}:`, executionError);
          
          // Fallback to manual atomic execution
          orderSuccess = await executeOrderManually(supabaseAdmin, order, currentPrice, logger);
        } else if (executionResult && executionResult.length > 0) {
          const result = executionResult[0];
          if (result.success) {
            orderSuccess = true;
            
            // Log RPC execution success with balance details
            await logger.logAudit({
              action: 'limit_order_executed_rpc',
              resourceType: 'exchange_order',
              resourceId: order.id,
              newValues: {
                executedPrice: currentPrice,
                limitPrice,
                side,
                amountRioz,
                amountBrl,
                newRiozBalance: result.new_rioz_balance,
                newBrlBalance: result.new_brl_balance,
                executionMethod: 'rpc_atomic'
              },
              severity: 'info'
            });
          } else {
            // RPC returned an error
            console.warn(`RPC returned failure for order ${order.id}:`, result.error_message);
            orderSuccess = await executeOrderManually(supabaseAdmin, order, currentPrice, logger);
          }
        } else {
          orderSuccess = await executeOrderManually(supabaseAdmin, order, currentPrice, logger);
        }

        if (orderSuccess) {
          processedOrders++;
          const orderDuration = Date.now() - orderStartTime;

          // Log successful execution with enhanced metrics for reconciliation
          await logger.logAudit({
            action: 'limit_order_executed',
            resourceType: 'exchange_order',
            resourceId: order.id,
            newValues: {
              executedPrice: currentPrice,
              limitPrice,
              side,
              amountRioz,
              amountBrl,
              executionTimeMs: orderDuration,
              userId: order.user_id,
              feeRioz: side === 'sell_rioz' ? amountRioz * FEE_RATE : 0,
              feeBrl: side === 'buy_rioz' ? amountBrl * FEE_RATE : 0
            },
            severity: 'info'
          });

          await logger.logMetric({ 
            name: 'limit_orders.execution_time_ms', 
            value: orderDuration,
            tags: { side, userId: order.user_id }
          });

          console.log(`✅ Executed limit order ${order.id} for user ${userId}: ${side} at ${currentPrice} (${orderDuration}ms)`);
        }

      } catch (orderError) {
        console.error(`Error processing order ${order.id}:`, orderError);
        await logger.logAudit({
          action: 'limit_order_failed',
          resourceType: 'exchange_order',
          resourceId: order.id,
          newValues: { error: orderError instanceof Error ? orderError.message : String(orderError) },
          severity: 'error'
        });

        // Mark order as failed
        await supabaseAdmin
          .from('exchange_orders')
          .update({ status: 'failed', cancelled_at: new Date().toISOString() })
          .eq('id', order.id);
      }
    }

    const totalDuration = Date.now() - startTime;
    await logger.logMetric({ name: 'limit_orders.batch_execution_time_ms', value: totalDuration });
    await logger.logMetric({ name: 'limit_orders.processed_count', value: processedOrders });

    await logger.logRequest(statusCode);

    return new Response(JSON.stringify({
      success: true,
      processedOrders,
      totalOrders: orders.length,
      currentPrice,
      source
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    error = err as Error;
    statusCode = 500;
    console.error('Error in execute-limit-orders:', error);
  }

  await logger.logRequest(statusCode, error);

  return new Response(
    JSON.stringify({ error: error?.message || 'Internal server error' }),
    { 
      status: statusCode, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});