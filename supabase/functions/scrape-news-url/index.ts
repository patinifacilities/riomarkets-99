import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL não fornecida' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔍 Scraping URL:', url);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // Extract meta tags and common patterns
    const extractMetaContent = (name: string): string | null => {
      const patterns = [
        new RegExp(`<meta\\s+property=["']${name}["']\\s+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+property=["']${name}["']`, 'i'),
        new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+name=["']${name}["']`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    // Extract title
    let title = extractMetaContent('og:title') || 
                extractMetaContent('twitter:title') ||
                html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
                '';
    
    title = title.trim().replace(/\s+/g, ' ');

    // Extract description
    let description = extractMetaContent('og:description') ||
                     extractMetaContent('twitter:description') ||
                     extractMetaContent('description') ||
                     '';
    
    description = description.trim().replace(/\s+/g, ' ');

    // Extract image
    let imageUrl = extractMetaContent('og:image') ||
                   extractMetaContent('twitter:image') ||
                   '';

    // If image is relative, make it absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      const baseUrl = new URL(url);
      imageUrl = `${baseUrl.protocol}//${baseUrl.host}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    // Extract site name / vehicle
    let vehicle = extractMetaContent('og:site_name') ||
                  extractMetaContent('twitter:site') ||
                  new URL(url).hostname.replace('www.', '') ||
                  '';
    
    vehicle = vehicle.trim().replace('@', '');

    // Extract published date
    let publishedAt = extractMetaContent('article:published_time') ||
                     extractMetaContent('og:published_time') ||
                     new Date().toISOString();

    // Try to get logo/favicon
    let logoUrl = extractMetaContent('og:image') || '';
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
    if (faviconMatch && faviconMatch[1]) {
      let favicon = faviconMatch[1];
      if (!favicon.startsWith('http')) {
        const baseUrl = new URL(url);
        favicon = `${baseUrl.protocol}//${baseUrl.host}${favicon.startsWith('/') ? '' : '/'}${favicon}`;
      }
      if (!logoUrl) logoUrl = favicon;
    }

    if (!title) {
      throw new Error('Não foi possível extrair o título da notícia');
    }

    console.log('✅ Extracted data:', {
      title,
      description,
      vehicle,
      imageUrl,
      publishedAt
    });

    // Save to database
    const { error: insertError } = await supabase
      .from('press_mentions')
      .insert({
        title,
        summary: description || null,
        vehicle: vehicle || 'Website',
        logo_url: logoUrl || null,
        url,
        published_at: publishedAt,
        status: 'draft' // Set as draft for admin review
      });

    if (insertError) {
      console.error('Error inserting to database:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          title,
          description,
          vehicle,
          imageUrl,
          publishedAt
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-news-url function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});