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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Starting automatic news scraping...');

    // Get all active news sources
    const { data: sources, error: sourcesError } = await supabaseClient
      .from('news_sources')
      .select('*')
      .eq('is_active', true);

    if (sourcesError) throw sourcesError;

    console.log(`📰 Found ${sources?.length || 0} active news sources`);

    let totalScraped = 0;
    let totalErrors = 0;

    // Scrape each source
    for (const source of sources || []) {
      try {
        console.log(`🌐 Scraping ${source.name} - ${source.url}`);
        
        const response = await fetch(source.url);
        const html = await response.text();

        // Basic scraping: look for <a> tags with href
        const linkRegex = /<a[^>]*href=["']([^"']*)"[^>]*>(.*?)<\/a>/gi;
        const matches = [...html.matchAll(linkRegex)];

        console.log(`Found ${matches.length} links in ${source.name}`);

        for (const match of matches) {
          const url = match[1];
          const title = match[2].replace(/<[^>]*>/g, '').trim();

          // Filter: only valid URLs and titles
          if (!url.startsWith('http') || title.length < 20 || title.length > 200) continue;

          // Check if article already exists
          const { data: existing } = await supabaseClient
            .from('press_mentions')
            .select('id')
            .eq('url', url)
            .maybeSingle();

          if (existing) continue;

          // Insert new article
          const { error: insertError } = await supabaseClient
            .from('press_mentions')
            .insert({
              title: title,
              summary: null,
              vehicle: source.name,
              logo_url: source.logo_url,
              url: url,
              published_at: new Date().toISOString(),
              status: 'published'
            });

          if (!insertError) {
            totalScraped++;
            console.log(`✅ Added: ${title.substring(0, 50)}...`);
          } else {
            console.error(`❌ Error inserting article:`, insertError);
            totalErrors++;
          }
        }

        // Update last_scraped_at for source
        await supabaseClient
          .from('news_sources')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', source.id);

      } catch (error) {
        console.error(`❌ Error scraping ${source.name}:`, error);
        totalErrors++;
      }
    }

    console.log(`✅ Scraping complete! Added: ${totalScraped}, Errors: ${totalErrors}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        scraped: totalScraped,
        errors: totalErrors,
        sources: sources?.length || 0
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error in scrape-news-auto:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
