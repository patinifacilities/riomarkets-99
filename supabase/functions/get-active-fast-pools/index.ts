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
    const { category } = await req.json();
    
    console.log('Getting active fast pools for category:', category);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get active pools for the category
    const { data: pools, error } = await supabase
      .from('fast_pools')
      .select('*')
      .eq('category', category)
      .eq('status', 'active')
      .gte('round_end_time', new Date().toISOString())
      .order('round_start_time', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    // If no active pools, create new ones for the current round
    if (!pools || pools.length === 0) {
      const now = new Date();
      const currentRound = Math.floor(now.getTime() / 60000); // Round number based on minutes since epoch

      console.log('No active pools found, creating new round:', currentRound);

      // Call create-fast-pool function
      const createResponse = await supabase.functions.invoke('create-fast-pool', {
        body: { category, round_number: currentRound }
      });

      if (createResponse.error) {
        throw createResponse.error;
      }

      return new Response(JSON.stringify(createResponse.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate time remaining for the current round
    const currentPool = pools[0];
    const timeRemaining = Math.max(0, new Date(currentPool.round_end_time).getTime() - new Date().getTime());
    const secondsRemaining = Math.ceil(timeRemaining / 1000);

    console.log('Found active pools:', pools.length, 'Time remaining:', secondsRemaining);

    return new Response(JSON.stringify({
      success: true,
      pools,
      current_round: currentPool.round_number,
      seconds_remaining: secondsRemaining,
      round_start_time: currentPool.round_start_time,
      round_end_time: currentPool.round_end_time
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-active-fast-pools function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      details: 'Failed to get active fast pools'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});