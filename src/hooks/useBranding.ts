import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BrandingConfig {
  id: string;
  logo_url: string | null;
  logo_white_url: string | null;
  logo_black_url: string | null;
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
    
    // Subscribe to changes
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
          if (payload.eventType === 'UPDATE') {
            const newConfig = payload.new as BrandingConfig;
            setConfig(newConfig);
            applyThemeToDocument(newConfig);
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
        // Apply theme immediately to prevent flash
        requestAnimationFrame(() => {
          applyThemeToDocument(data);
        });
      }
    } catch (error) {
      console.error('Error fetching branding config:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyThemeToDocument = (brandingConfig: BrandingConfig) => {
    if (!brandingConfig) return;
    
    const root = document.documentElement;
    
    // Convert hex to HSL for CSS variables
    const hexToHSL = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '0 0% 0%';
      
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);
      
      return `${h} ${s}% ${l}%`;
    };

    root.style.setProperty('--primary', hexToHSL(brandingConfig.primary_color));
    root.style.setProperty('--success', hexToHSL(brandingConfig.success_color));
    root.style.setProperty('--background', hexToHSL(brandingConfig.background_color));
    
    // Apply opinion button colors
    if (brandingConfig.opinion_yes_color) {
      root.style.setProperty('--opinion-yes', hexToHSL(brandingConfig.opinion_yes_color));
    }
    if (brandingConfig.opinion_no_color) {
      root.style.setProperty('--opinion-no', hexToHSL(brandingConfig.opinion_no_color));
    }
  };

  return { config, loading };
};
