import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting rates history population...')

    // Generate historical data for the last 7 days if empty
    const { data: existingHistory } = await supabase
      .from('rates_history')
      .select('id')
      .limit(1)

    if (!existingHistory || existingHistory.length === 0) {
      console.log('No historical data found, generating 7 days of history...')
      
      const historicalData = []
      let currentPrice = 5.50 // Starting price
      
      // Generate data for last 7 days (every hour = 168 points)
      for (let hours = 168; hours >= 0; hours--) {
        const timestamp = new Date(Date.now() - (hours * 60 * 60 * 1000))
        
        // Realistic price variation: ±0.5% per hour
        const variation = (Math.random() - 0.5) * 0.01 // ±0.5%
        currentPrice = Math.max(0.1, currentPrice * (1 + variation))
        
        historicalData.push({
          symbol: 'RIOZBRL',
          price: Math.round(currentPrice * 10000) / 10000, // 4 decimal places
          volume: Math.round(Math.random() * 50000 + 10000), // Random volume
          timestamp: timestamp.toISOString()
        })
      }

      const { error: insertError } = await supabase
        .from('rates_history')
        .insert(historicalData)

      if (insertError) {
        console.error('Error inserting historical data:', insertError)
        throw insertError
      }

      console.log(`Inserted ${historicalData.length} historical records`)

      // Update the current rate with the latest price
      const latestPrice = historicalData[historicalData.length - 1].price
      
      const { error: updateError } = await supabase
        .from('rates')
        .update({ 
          price: latestPrice,
          updated_at: new Date().toISOString()
        })
        .eq('symbol', 'RIOZBRL')

      if (updateError) {
        console.error('Error updating current rate:', updateError)
        throw updateError
      }

      console.log(`Updated current rate to ${latestPrice}`)
    }

    // Add a new data point (simulate real-time updates)
    const { data: currentRate } = await supabase
      .from('rates')
      .select('price')
      .eq('symbol', 'RIOZBRL')
      .single()

    if (currentRate) {
      // Small variation for new data point
      const variation = (Math.random() - 0.5) * 0.005 // ±0.25%
      const newPrice = Math.max(0.1, currentRate.price * (1 + variation))
      const roundedPrice = Math.round(newPrice * 10000) / 10000

      // Insert new history point
      const { error: historyError } = await supabase
        .from('rates_history')
        .insert({
          symbol: 'RIOZBRL',
          price: roundedPrice,
          volume: Math.round(Math.random() * 20000 + 5000),
          timestamp: new Date().toISOString()
        })

      if (historyError) {
        console.error('Error inserting new history point:', historyError)
        throw historyError
      }

      // Update current rate (this will trigger change24h calculation)
      const { error: rateError } = await supabase
        .from('rates')
        .update({ 
          price: roundedPrice,
          updated_at: new Date().toISOString()
        })
        .eq('symbol', 'RIOZBRL')

      if (rateError) {
        console.error('Error updating rate:', rateError)
        throw rateError
      }

      console.log(`Added new rate: ${roundedPrice}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Rates history populated successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in populate-rates-history:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})