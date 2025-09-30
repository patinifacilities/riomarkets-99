import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pool_id, side, amount_rioz, odds } = await req.json();
    
    if (!pool_id || !side || !amount_rioz || !odds) {
      throw new Error('Missing required parameters: pool_id, side, amount_rioz, odds');
    }

    console.log('Placing fast bet:', { pool_id, side, amount_rioz, odds });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error('Invalid user token');
    }

    const user_id = userData.user.id;

    // Verify pool is still active and not expired
    const { data: pool, error: poolError } = await supabase
      .from('fast_pools')
      .select('*')
      .eq('id', pool_id)
      .eq('status', 'active')
      .single();

    if (poolError || !pool) {
      throw new Error('Pool not found or not active');
    }

    // Check if pool is still accepting bets (not in last 10 seconds)
    const timeRemaining = new Date(pool.round_end_time).getTime() - new Date().getTime();
    if (timeRemaining <= 10000) { // 10 seconds in milliseconds
      throw new Error('Pool closed - cannot place bets in the last 10 seconds');
    }

    // Get user profile and check balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('saldo_moeda')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    if (profile.saldo_moeda < amount_rioz) {
      throw new Error('Insufficient balance');
    }

    // Start transaction: deduct balance and create bet
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ saldo_moeda: profile.saldo_moeda - amount_rioz })
      .eq('id', user_id);

    if (updateError) {
      throw updateError;
    }

    // Create bet record
    const { data: bet, error: betError } = await supabase
      .from('fast_pool_bets')
      .insert({
        user_id,
        pool_id,
        side,
        amount_rioz,
        odds
      })
      .select()
      .single();

    if (betError) {
      // Rollback balance update if bet creation fails
      await supabase
        .from('profiles')
        .update({ saldo_moeda: profile.saldo_moeda })
        .eq('id', user_id);
      
      throw betError;
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        id: `fast_bet_${bet.id}_${Date.now()}`,
        user_id,
        tipo: 'debito',
        valor: amount_rioz,
        descricao: `Fast Market Bet - Pool ${pool.asset_name} (${side.toUpperCase()})`
      });

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      // Don't fail the bet for transaction logging error
    }

    console.log('Fast bet placed successfully:', bet.id);

    return new Response(JSON.stringify({
      success: true,
      bet_id: bet.id,
      message: 'Bet placed successfully',
      new_balance: profile.saldo_moeda - amount_rioz
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in place-fast-bet function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      details: 'Failed to place fast bet'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});