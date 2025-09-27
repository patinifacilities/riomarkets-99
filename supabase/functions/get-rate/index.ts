import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get current rate for RIOZBRL
    const { data: rateData, error: rateError } = await supabaseClient
      .from('rates')
      .select('price, change24h, updated_at')
      .eq('symbol', 'RIOZBRL')
      .single();

    if (rateError) {
      console.error('Error fetching rate:', rateError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch rate data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!rateData) {
      return new Response(
        JSON.stringify({ error: 'Rate not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Rate fetched successfully:', rateData);

    return new Response(
      JSON.stringify({
        price: parseFloat(rateData.price),
        change24h: parseFloat(rateData.change24h),
        updated_at: rateData.updated_at,
        symbol: 'RIOZBRL'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in get-rate:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});