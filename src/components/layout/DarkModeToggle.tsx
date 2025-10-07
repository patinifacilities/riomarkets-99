import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function DarkModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply branding theme when light mode is activated
  useEffect(() => {
    if (!mounted) return;
    
    const applyBrandingTheme = async () => {
      if (resolvedTheme === 'light') {
        try {
          const { data, error } = await supabase
            .from('branding_config')
            .select('*')
            .eq('active_theme', 'whitemode')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data && !error) {
            const root = document.documentElement;
            
            // Convert hex to HSL
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

            // Apply white mode theme colors
            root.style.setProperty('--background', hexToHSL(data.background_color));
            root.style.setProperty('--primary', hexToHSL(data.primary_color));
            root.style.setProperty('--success', hexToHSL(data.success_color));
          }
        } catch (error) {
          console.error('Error applying branding theme:', error);
        }
      } else {
        // Reset to default dark theme
        const root = document.documentElement;
        root.style.removeProperty('--background');
        root.style.removeProperty('--primary');
        root.style.removeProperty('--success');
      }
    };

    applyBrandingTheme();
  }, [resolvedTheme, mounted]);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-9 h-9 p-0"
        disabled
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleThemeToggle}
      className="w-9 h-9 p-0"
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] transition-all ${resolvedTheme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${resolvedTheme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}