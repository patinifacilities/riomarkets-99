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
    const { category, round_number } = await req.json();
    
    console.log('Creating fast pools for category:', category, 'round:', round_number);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const roundStartTime = new Date(now);
    roundStartTime.setSeconds(0, 0); // Start at the beginning of a minute
    const roundEndTime = new Date(roundStartTime.getTime() + 60000); // 60 seconds later

    // Pool definitions for each category
    const poolTemplates = {
      commodities: [
        { 
          asset_symbol: 'OIL_WTI', 
          asset_name: 'Petróleo WTI',
          question: 'O Petróleo vai subir nos próximos 60 segundos?'
        },
        { 
          asset_symbol: 'GOLD', 
          asset_name: 'Ouro',
          question: 'O Ouro vai subir nos próximos 60 segundos?'
        },
        { 
          asset_symbol: 'SILVER', 
          asset_name: 'Prata',
          question: 'A Prata vai subir nos próximos 60 segundos?'
        }
      ],
      crypto: [
        { 
          asset_symbol: 'BTC_USD', 
          asset_name: 'Bitcoin',
          question: 'O Bitcoin vai subir nos próximos 60 segundos?'
        },
        { 
          asset_symbol: 'ETH_USD', 
          asset_name: 'Ethereum',
          question: 'O Ethereum vai subir nos próximos 60 segundos?'
        },
        { 
          asset_symbol: 'SOL_USD', 
          asset_name: 'Solana',
          question: 'A Solana vai subir nos próximos 60 segundos?'
        }
      ],
      forex: [
        { 
          asset_symbol: 'USD_BRL', 
          asset_name: 'USD/BRL',
          question: 'O USD/BRL vai subir nos próximos 60 segundos?'
        },
        { 
          asset_symbol: 'EUR_USD', 
          asset_name: 'EUR/USD',
          question: 'O EUR/USD vai subir nos próximos 60 segundos?'
        },
        { 
          asset_symbol: 'GBP_USD', 
          asset_name: 'GBP/USD',
          question: 'O GBP/USD vai subir nos próximos 60 segundos?'
        }
      ],
      stocks: [
        { 
          asset_symbol: 'AAPL', 
          asset_name: 'Apple',
          question: 'A Apple vai subir nos próximos 60 segundos?'
        },
        { 
          asset_symbol: 'MSFT', 
          asset_name: 'Microsoft',
          question: 'A Microsoft vai subir nos próximos 60 segundos?'
        },
        { 
          asset_symbol: 'TSLA', 
          asset_name: 'Tesla',
          question: 'A Tesla vai subir nos próximos 60 segundos?'
        }
      ]
    };

    const templates = poolTemplates[category as keyof typeof poolTemplates] || poolTemplates.commodities;
    const createdPools = [];

    for (const template of templates) {
      // Get current price for the asset (mock for now, can be replaced with real API)
      const mockPrices = {
        'OIL_WTI': 73.45,
        'GOLD': 2018.30,
        'SILVER': 24.12,
        'BTC_USD': 42350.00,
        'ETH_USD': 2545.80,
        'SOL_USD': 98.75,
        'USD_BRL': 5.12,
        'EUR_USD': 1.08,
        'GBP_USD': 1.26,
        'AAPL': 185.40,
        'MSFT': 375.20,
        'TSLA': 248.85
      };

      const openingPrice = mockPrices[template.asset_symbol as keyof typeof mockPrices] || 100;

      const { data: pool, error } = await supabase
        .from('fast_pools')
        .insert({
          round_number,
          category,
          asset_symbol: template.asset_symbol,
          asset_name: template.asset_name,
          question: template.question,
          opening_price: openingPrice,
          round_start_time: roundStartTime.toISOString(),
          round_end_time: roundEndTime.toISOString(),
          status: 'active',
          base_odds: 1.65
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating pool:', error);
        throw error;
      }

      createdPools.push(pool);
    }

    console.log('Created pools:', createdPools.length);

    return new Response(JSON.stringify({
      success: true,
      pools: createdPools,
      round_start_time: roundStartTime.toISOString(),
      round_end_time: roundEndTime.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-fast-pool function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      details: 'Failed to create fast pools'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});