import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BrandingConfig {
  id: string;
  logo_url: string | null;
  logo_white_url: string | null;
  logo_black_url: string | null;
  logo_light_url: string | null;
  background_color: string;
  primary_color: string;
  success_color: string;
  active_theme: string;
  opinion_yes_color?: string;
  opinion_no_color?: string;
}

export const useBranding = () => {
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrandingConfig();
    
    // Subscribe to realtime changes for logos only
    const channel = supabase
      .channel('branding_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'branding_config'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newConfig = payload.new as BrandingConfig;
            setConfig(newConfig);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBrandingConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('branding_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      
      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching branding config:', error);
    } finally {
      setLoading(false);
    }
  };

  return { config, loading };
};
