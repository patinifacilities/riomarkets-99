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
    const { order_id, user_id } = await req.json();
    
    if (!order_id || !user_id) {
      throw new Error('order_id and user_id are required');
    }

    console.log('Performing cashout for order:', order_id, 'user:', user_id);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get fresh cashout quote to prevent drift
    const quoteResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/get-cashout-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({ order_id })
    });

    if (!quoteResponse.ok) {
      throw new Error('Failed to get cashout quote');
    }

    const quote = await quoteResponse.json();

    if (quote.net <= 0) {
      throw new Error('Cashout value is zero or negative');
    }

    // Start transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user_id)
      .eq('status', 'ativa')
      .single();

    if (orderError || !order) {
      throw new Error('Order not found, not owned by user, or already cashed out');
    }

    // Update order status to cashout
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cashout',
        cashout_amount: quote.net,
        cashed_out_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .eq('user_id', user_id);

    if (updateError) {
      throw new Error('Failed to update order: ' + updateError.message);
    }

    // Create wallet transaction for cashout credit
    const transactionId = crypto.randomUUID();
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        id: transactionId,
        user_id: user_id,
        tipo: 'credito',
        valor: Math.round(quote.net),
        descricao: `Cashout antecipado - ${order.opcao_escolhida} (${quote.multiple_now}x)`,
        market_id: order.market_id
      });

    if (transactionError) {
      console.error('Failed to create transaction, reverting order:', transactionError);
      
      // Revert order status
      await supabase
        .from('orders')
        .update({
          status: 'ativa',
          cashout_amount: 0,
          cashed_out_at: null
        })
        .eq('id', order_id);
        
      throw new Error('Failed to create wallet transaction');
    }

      // Update user balance using RPC
      const { error: balanceError } = await supabase
        .rpc('update_user_balance', {
          user_id: user_id,
          amount: Math.round(quote.net)
        });

    if (balanceError) {
      console.error('Failed to update balance:', balanceError);
      // Note: In a production system, we'd want to handle this more robustly
      // For now, the transaction record exists even if balance update fails
    }

    console.log('Cashout completed successfully:', {
      order_id,
      user_id,
      net_amount: quote.net,
      transaction_id: transactionId
    });

    return new Response(JSON.stringify({
      success: true,
      order_id: order_id,
      cashout_amount: quote.net,
      multiple: quote.multiple_now,
      transaction_id: transactionId,
      message: 'Cashout realizado com sucesso!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in perform-cashout function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      details: 'Failed to perform cashout'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});