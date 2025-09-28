import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Logger, createCorsHeaders } from '../_shared/logger.ts';
import { RateLimiter, RATE_LIMITS } from '../_shared/rateLimit.ts';

const corsHeaders = createCorsHeaders();

const FEE_RATE = 0.01; // 1%
const MIN_BRL = 5.00;
const MAX_BRL = 1000000.00; // 1 milhão máximo

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  // Create logging context
  const context = Logger.createContext(req, 'exchange-convert');
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
    const { side, amountInput, inputCurrency } = await req.json();
    
    // Validate input
    if (!side || !amountInput || !inputCurrency) {
      statusCode = 400;
      throw new Error('Missing required fields: side, amountInput, inputCurrency');
    }

    if (!['buy_rioz', 'sell_rioz'].includes(side)) {
      statusCode = 400;
      throw new Error('Invalid side. Must be buy_rioz or sell_rioz');
    }

    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      statusCode = 400;
      throw new Error('Invalid amount');
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

    // Rate limiting check
    const rateLimiter = new RateLimiter(supabaseUrl, supabaseKey);
    const rateLimit = await rateLimiter.checkRateLimit(
      user.id,
      'exchange-convert',
      RATE_LIMITS['exchange-convert'],
      true
    );

    if (!rateLimit.allowed) {
      statusCode = 429;
      await logger.logRequest(statusCode);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: { ...corsHeaders, ...RateLimiter.createHeaders(rateLimit) }
        }
      );
    }

    // Start atomic transaction
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Fixed 1:1 rate for RIOZ/BRL
    const price = 1.0;
    let amountRioz: number, amountBrl: number, feeRioz: number, feeBrl: number;

    // Calculate amounts based on conversion side with 1% fee
    if (side === 'buy_rioz') {
      // Comprando RIOZ com BRL
      if (inputCurrency === 'BRL') {
        amountBrl = amount;
        feeBrl = amountBrl * FEE_RATE; // Taxa sobre o BRL
        const netBrl = amountBrl - feeBrl; // BRL líquido após taxa
        amountRioz = netBrl / price; // RIOZ que o usuário recebe
        feeRioz = 0;
      } else {
        // Input é RIOZ desejado
        amountRioz = amount;
        amountBrl = amountRioz * price;
        feeBrl = amountBrl * FEE_RATE;
        feeRioz = 0;
      }
    } else { // sell_rioz
      // Vendendo RIOZ por BRL
      if (inputCurrency === 'RIOZ') {
        amountRioz = amount;
        feeRioz = amountRioz * FEE_RATE; // Taxa sobre o RIOZ
        const netRioz = amountRioz - feeRioz; // RIOZ líquido após taxa
        amountBrl = netRioz * price; // BRL que o usuário recebe
        feeBrl = 0;
      } else {
        // Input é BRL desejado
        amountBrl = amount;
        amountRioz = amountBrl / price;
        feeRioz = amountRioz * FEE_RATE;
        feeBrl = 0;
      }
    }

    // Validate limits for BRL operations
    const brlAmount = side === 'buy_rioz' ? amountBrl : amountBrl + feeBrl;
    if (brlAmount < MIN_BRL || brlAmount > MAX_BRL) {
      statusCode = 400;
      throw new Error(`Amount must be between R$ ${MIN_BRL.toFixed(2)} and R$ ${MAX_BRL.toFixed(2)}`);
    }

    // Get user balance from balances table only
    const { data: balanceData, error: balanceError } = await supabaseAdmin
      .from('balances')
      .select('rioz_balance, brl_balance')
      .eq('user_id', user.id)
      .single();

    let currentRiozBalance = 0;
    let currentBrlBalance = 0;

    if (balanceError) {
      // If balance doesn't exist, create it
      if (balanceError.code === 'PGRST116') {
        const { data: newBalance, error: createError } = await supabaseAdmin
          .from('balances')
          .insert({
            user_id: user.id,
            rioz_balance: 0,
            brl_balance: 0
          })
          .select()
          .single();
          
        if (createError) {
          statusCode = 500;
          throw new Error('Failed to create balance');
        }
      } else {
        statusCode = 500;
        throw new Error('Failed to get user balance');
      }
    } else {
      currentRiozBalance = parseFloat(balanceData?.rioz_balance || '0');
      currentBrlBalance = parseFloat(balanceData?.brl_balance || '0');
    }
    
    // Check sufficient balance
    if (side === 'buy_rioz' && currentBrlBalance < (amountBrl + feeBrl)) {
      statusCode = 400;
      throw new Error('Insufficient BRL balance');
    }

    if (side === 'sell_rioz' && currentRiozBalance < (amountRioz + feeRioz)) {
      statusCode = 400;
      throw new Error('Insufficient Rioz balance');
    }

    // Create exchange order
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('exchange_orders')
      .insert({
        user_id: user.id,
        side,
        price_brl_per_rioz: price,
        amount_rioz: amountRioz,
        amount_brl: amountBrl,
        fee_rioz: feeRioz,
        fee_brl: feeBrl,
        status: 'filled'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      statusCode = 500;
      throw new Error('Failed to create order');
    }

    // Update balances - ONLY balances table
    let newRiozBalance: number, newBrlBalance: number;
    
    if (side === 'buy_rioz') {
      // Compra: Gasta BRL (+ taxa), Ganha RIOZ
      newBrlBalance = currentBrlBalance - amountBrl - feeBrl;
      newRiozBalance = currentRiozBalance + amountRioz;
    } else {
      // Venda: Gasta RIOZ (+ taxa), Ganha BRL
      newRiozBalance = currentRiozBalance - amountRioz - feeRioz;
      newBrlBalance = currentBrlBalance + amountBrl;
    }

    const { error: updateError } = await supabaseAdmin
      .from('balances')
      .upsert({
        user_id: user.id,
        rioz_balance: newRiozBalance,
        brl_balance: newBrlBalance,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating balance:', updateError);
      statusCode = 500;
      throw new Error('Failed to update balance');
    }

    console.log(`Exchange completed: ${side} for user ${user.id}`, {
      amountRioz,
      amountBrl,
      feeRioz,
      feeBrl,
      price,
      newRiozBalance,
      newBrlBalance
    });

    // Log audit event
    await logger.logAudit({
      action: 'exchange_completed',
      resourceType: 'exchange_order',
      resourceId: orderData.id,
      newValues: {
        side,
        amountRioz,
        amountBrl,
        feeRioz,
        feeBrl,
        price
      },
      severity: 'info'
    });

    // Log telemetry event for successful conversion
    await supabaseAdmin.rpc('log_exchange_event', {
      p_user_id: user.id,
      p_event_type: 'exchange_conversion_completed',
      p_event_data: {
        orderId: orderData.id,
        side, 
        amountRioz, 
        amountBrl, 
        feeRioz, 
        feeBrl,
        price,
        newRiozBalance,
        newBrlBalance,
        correlationId: context.correlationId
      },
      p_correlation_id: context.correlationId
    });

    await logger.logRequest(statusCode);

    return new Response(
      JSON.stringify({
        orderId: orderData.id,
        status: 'filled',
        appliedPrice: price,
        amountRioz: amountRioz,
        amountBrl: amountBrl,
        feeRioz: feeRioz,
        feeBrl: feeBrl,
        newBalances: {
          rioz_balance: newRiozBalance,
          brl_balance: newBrlBalance
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, ...RateLimiter.createHeaders(rateLimit), 'Content-Type': 'application/json' }
      }
    );

  } catch (err) {
    error = err as Error;
    console.error('Unexpected error in exchange-convert:', error);
    
    // Log telemetry event for failed conversion (if we have user context)
    if (context.userId) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        await supabaseAdmin.rpc('log_exchange_event', {
          p_user_id: context.userId,
          p_event_type: 'exchange_conversion_failed',
          p_event_data: {
            error: error.message,
            statusCode,
            correlationId: context.correlationId
          },
          p_correlation_id: context.correlationId
        });
      } catch (telemetryError) {
        console.error('Failed to log telemetry event:', telemetryError);
      }
    }
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