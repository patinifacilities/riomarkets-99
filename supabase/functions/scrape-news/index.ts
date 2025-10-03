import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Starting news scraping process...');

    // Get active news sources
    const { data: sources, error: sourcesError } = await supabase
      .from('news_sources')
      .select('*')
      .eq('is_active', true);

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
      throw sourcesError;
    }

    if (!sources || sources.length === 0) {
      console.log('No active sources found');
      return new Response(
        JSON.stringify({ message: 'No active sources to scrape' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📰 Found ${sources.length} active sources`);

    let totalScraped = 0;
    let totalErrors = 0;

    // Process each source
    for (const source of sources as NewsSource[]) {
      try {
        console.log(`Scraping ${source.name} (${source.url})`);

        // Fetch the webpage
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          console.error(`Failed to fetch ${source.name}: ${response.status}`);
          totalErrors++;
          continue;
        }

        const html = await response.text();

        // Simple scraping - look for common news patterns
        // This is a basic implementation - in production you'd want more sophisticated parsing
        const titleMatches = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi) || [];
        const linkMatches = html.match(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi) || [];

        // Extract potential news articles
        const articles: Array<{
          title: string;
          url: string;
          summary: string | null;
        }> = [];

        for (let i = 0; i < Math.min(titleMatches.length, 10); i++) {
          const titleMatch = titleMatches[i];
          const title = titleMatch.replace(/<[^>]*>/g, '').trim();
          
          // Find corresponding link
          let articleUrl = source.url;
          for (const linkMatch of linkMatches) {
            if (linkMatch.toLowerCase().includes(title.toLowerCase().substring(0, 20))) {
              const urlMatch = linkMatch.match(/href="([^"]*)"/);
              if (urlMatch) {
                articleUrl = urlMatch[1];
                if (!articleUrl.startsWith('http')) {
                  const baseUrl = new URL(source.url);
                  articleUrl = `${baseUrl.protocol}//${baseUrl.host}${articleUrl}`;
                }
                break;
              }
            }
          }

          if (title.length > 10 && title.length < 200) {
            articles.push({
              title,
              url: articleUrl,
              summary: null,
            });
          }
        }

        console.log(`Found ${articles.length} potential articles from ${source.name}`);

        // Insert articles into press_mentions
        for (const article of articles) {
          // Check if article already exists
          const { data: existing } = await supabase
            .from('press_mentions')
            .select('id')
            .eq('url', article.url)
            .single();

          if (!existing) {
            const { error: insertError } = await supabase
              .from('press_mentions')
              .insert({
                title: article.title,
                summary: article.summary,
                vehicle: source.name,
                logo_url: source.logo_url,
                url: article.url,
                published_at: new Date().toISOString(),
                status: 'draft', // Set as draft for admin review
              });

            if (insertError) {
              console.error(`Error inserting article: ${insertError.message}`);
            } else {
              totalScraped++;
            }
          }
        }

        // Update last_scraped_at
        await supabase
          .from('news_sources')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', source.id);

      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
        totalErrors++;
      }
    }

    console.log(`✅ Scraping complete: ${totalScraped} articles scraped, ${totalErrors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        totalScraped,
        totalErrors,
        sourcesProcessed: sources.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
