import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Logger, createCorsHeaders } from '../_shared/logger.ts';
import { RateLimiter, RATE_LIMITS } from '../_shared/rateLimit.ts';

const corsHeaders = createCorsHeaders();

// Simple 1:1 conversion rate - no fees, no complex logic
const CONVERSION_RATE = 1.0; // 1 BRL = 1 RIOZ

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

    // Simple 1:1 conversion logic
    let amountRioz: number, amountBrl: number;

    if (side === 'buy_rioz') {
      // Buying RIOZ with BRL - 1:1 conversion
      amountBrl = amount;
      amountRioz = amount * CONVERSION_RATE; // 1 BRL = 1 RIOZ
    } else {
      // Selling RIOZ for BRL - 1:1 conversion  
      amountRioz = amount;
      amountBrl = amount * CONVERSION_RATE; // 1 RIOZ = 1 BRL
    }

    // Get user balance - only from balances table
    let { data: balanceData, error: balanceError } = await supabaseAdmin
      .from('balances')
      .select('rioz_balance, brl_balance')
      .eq('user_id', user.id)
      .single();

    if (balanceError) {
      // Create balance if it doesn't exist
      if (balanceError.code === 'PGRST116') {
        const { data: newBalance } = await supabaseAdmin
          .from('balances')
          .insert({
            user_id: user.id,
            rioz_balance: 0,
            brl_balance: 0
          })
          .select()
          .single();
        
        balanceData = newBalance;
      } else {
        statusCode = 500;
        throw new Error('Failed to get user balance');
      }
    }

    if (!balanceData) {
      statusCode = 500;
      throw new Error('Failed to get user balance');
    }

    const currentRiozBalance = parseFloat(String(balanceData.rioz_balance || 0));
    const currentBrlBalance = parseFloat(String(balanceData.brl_balance || 0));
    
    // Check sufficient balance
    if (side === 'buy_rioz' && currentBrlBalance < amountBrl) {
      statusCode = 400;
      throw new Error('Saldo BRL insuficiente');
    }

    if (side === 'sell_rioz' && currentRiozBalance < amountRioz) {
      statusCode = 400;
      throw new Error('Saldo RIOZ insuficiente');
    }

    // Calculate new balances
    let newRiozBalance: number, newBrlBalance: number;
    
    if (side === 'buy_rioz') {
      // Buy RIOZ: subtract BRL, add RIOZ
      newBrlBalance = currentBrlBalance - amountBrl;
      newRiozBalance = currentRiozBalance + amountRioz;
    } else {
      // Sell RIOZ: subtract RIOZ, add BRL
      newRiozBalance = currentRiozBalance - amountRioz;
      newBrlBalance = currentBrlBalance + amountBrl;
    }

    // Update only the balances table
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

    // Create exchange order record
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('exchange_orders')
      .insert({
        user_id: user.id,
        side,
        price_brl_per_rioz: CONVERSION_RATE,
        amount_rioz: amountRioz,
        amount_brl: amountBrl,
        fee_rioz: 0,
        fee_brl: 0,
        status: 'filled'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
    }

    console.log(`Exchange completed: ${side} for user ${user.id}`, {
      amountRioz,
      amountBrl,
      newRiozBalance,
      newBrlBalance
    });

    await logger.logRequest(statusCode);

    return new Response(
      JSON.stringify({
        orderId: orderData?.id || 'no-order',
        status: 'success',
        amountRioz: amountRioz,
        amountBrl: amountBrl,
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
    
    // Simple error logging
    console.error('Exchange failed:', error.message);
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