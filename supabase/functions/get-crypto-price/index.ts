import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { symbol = 'BTC' } = await req.json();

    // Use CoinGecko API for real-time crypto prices
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${getCoinId(symbol)}&vs_currencies=usd`);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const coinId = getCoinId(symbol);
    const price = data[coinId]?.usd;

    if (!price) {
      throw new Error(`Price not found for ${symbol}`);
    }

    return new Response(
      JSON.stringify({ 
        symbol,
        price,
        timestamp: new Date().toISOString(),
        source: 'coingecko'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const symbolParam = req.url.includes('symbol') ? 'BTC' : 'BTC';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        fallback_price: getFallbackPrice(symbolParam)
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

function getCoinId(symbol: string): string {
  const mapping = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'ADA': 'cardano',
    'SOL': 'solana',
    'XRP': 'ripple',
    'DOT': 'polkadot',
    'DOGE': 'dogecoin',
    'AVAX': 'avalanche-2',
    'MATIC': 'matic-network'
  };
  return mapping[symbol as keyof typeof mapping] || 'bitcoin';
}

function getFallbackPrice(symbol: string): number {
  const fallbackPrices = {
    'BTC': 43000,
    'ETH': 2600,
    'BNB': 300,
    'ADA': 0.50,
    'SOL': 100,
    'XRP': 0.60,
    'DOT': 7,
    'DOGE': 0.08,
    'AVAX': 35,
    'MATIC': 0.85
  };
  return fallbackPrices[symbol as keyof typeof fallbackPrices] || 43000;
}