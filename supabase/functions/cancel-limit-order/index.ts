import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Logger, createCorsHeaders } from '../_shared/logger.ts';

const corsHeaders = createCorsHeaders();

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const context = Logger.createContext(req, 'cancel-limit-order');
  const logger = new Logger(supabaseUrl, supabaseKey, context);

  let statusCode = 200;
  let error: Error | undefined;

  if (req.method !== 'POST') {
    statusCode = 405;
    error = new Error('Method not allowed');
    await logger.logRequest(statusCode, error);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      statusCode = 400;
      throw new Error('Missing orderId');
    }

    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      statusCode = 401;
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      statusCode = 401;
      throw new Error('Invalid or expired token');
    }

    context.userId = user.id;

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get the order to verify ownership and status
    const { data: order, error: orderError } = await supabaseAdmin
      .from('exchange_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      statusCode = 404;
      throw new Error('Order not found or not owned by user');
    }

    // Check if order can be cancelled
    if (order.status !== 'pending') {
      statusCode = 400;
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    if (order.order_type !== 'limit') {
      statusCode = 400;
      throw new Error('Can only cancel limit orders');
    }

    // Cancel the order
    const { error: cancelError } = await supabaseAdmin
      .from('exchange_orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (cancelError) {
      statusCode = 500;
      throw new Error('Failed to cancel order');
    }

    // Log audit event
    await logger.logAudit({
      action: 'limit_order_cancelled',
      resourceType: 'exchange_order',
      resourceId: orderId,
      oldValues: {
        status: order.status,
        limitPrice: order.limit_price,
        side: order.side
      },
      newValues: {
        status: 'cancelled'
      },
      severity: 'info'
    });

    await logger.logRequest(statusCode);

    return new Response(JSON.stringify({
      success: true,
      orderId,
      message: 'Order cancelled successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    error = err as Error;
    console.error('Error in cancel-limit-order:', error);
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