import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsSource {
  id: string;
  name: string;
  url: string;
  logo_url: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting news scraping...');

    // Fetch active news sources
    const { data: sources, error: sourcesError } = await supabaseClient
      .from('news_sources')
      .select('*')
      .eq('is_active', true);

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
      throw sourcesError;
    }

    console.log(`Found ${sources?.length || 0} active news sources`);

    let totalScraped = 0;
    let errors = 0;

    // Scrape each source
    for (const source of (sources || [])) {
      try {
        console.log(`Scraping ${source.name}...`);
        
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch ${source.name}: ${response.status}`);
          errors++;
          continue;
        }

        const html = await response.text();
        
        // Basic regex to extract article titles and links
        const articleMatches = html.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi);
        const articles = [];
        
        for (const match of articleMatches) {
          const url = match[1];
          const title = match[2].trim();
          
          // Filter out navigation, menu items, etc.
          if (title.length > 20 && title.length < 200 && 
              !title.includes('menu') && 
              !title.includes('Menu') &&
              url.includes('http')) {
            articles.push({
              title,
              url: url.startsWith('http') ? url : `${source.url}${url}`,
            });
          }
        }

        console.log(`Found ${articles.length} potential articles from ${source.name}`);

        // Save unique articles to database
        for (const article of articles.slice(0, 5)) { // Limit to 5 per source
          // Check if article already exists
          const { data: existing } = await supabaseClient
            .from('press_mentions')
            .select('id')
            .eq('url', article.url)
            .single();

          if (!existing) {
            const { error: insertError } = await supabaseClient
              .from('press_mentions')
              .insert({
                title: article.title,
                url: article.url,
                vehicle: source.name,
                logo_url: source.logo_url,
                status: 'published', // Auto-publish scraped news
                published_at: new Date().toISOString()
              });

            if (!insertError) {
              totalScraped++;
            }
          }
        }

        // Update last_scraped_at
        await supabaseClient
          .from('news_sources')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', source.id);

      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
        errors++;
      }
    }

    console.log(`Scraping complete. Total: ${totalScraped}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalScraped,
        errors,
        sources: sources?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Fatal error in scrape-news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
