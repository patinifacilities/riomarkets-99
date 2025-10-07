import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Palette, Save, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

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
}

interface BrandingHistory {
  config: BrandingConfig;
  timestamp: number;
}

const THEMES = {
  theme1: {
    name: 'Tema Padrão (Rio)',
    background_color: '#0a0a0a',
    primary_color: '#ff2389',
    success_color: '#00ff90',
  },
  theme2: {
    name: 'Tema Oceano',
    background_color: '#0f1419',
    primary_color: '#1DA1F2',
    success_color: '#17BF63',
  },
  whitemode: {
    name: 'White Mode',
    background_color: '#ffffff',
    primary_color: '#00b86b',
    success_color: '#00b86b',
  }
};

const AdminBranding = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [uploading, setUploading] = useState<{[key: string]: boolean}>({});
  const [history, setHistory] = useState<BrandingHistory[]>([]);
  const [customThemeEnabled, setCustomThemeEnabled] = useState(false);
  const [customThemeColors, setCustomThemeColors] = useState<{
    background_color: string;
    primary_color: string;
    success_color: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchBrandingConfig();
    }
  }, [user]);

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
        const configData: BrandingConfig = {
          ...data,
          logo_light_url: data.logo_light_url || null
        };
        setConfig(configData);
        // Save custom theme colors if active_theme is 'custom'
        if (configData.active_theme === 'custom') {
          setCustomThemeColors({
            background_color: configData.background_color,
            primary_color: configData.primary_color,
            success_color: configData.success_color,
          });
        }
        // Save initial state to history
        setHistory([{ config: configData, timestamp: Date.now() }]);
      }
    } catch (error) {
      console.error('Error fetching branding config:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyThemeToDocument = (brandingConfig: BrandingConfig, enabled: boolean = customThemeEnabled) => {
    if (!enabled) return; // Don't apply if custom themes are disabled
    
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

    // Apply theme colors
    root.style.setProperty('--primary', hexToHSL(brandingConfig.primary_color));
    root.style.setProperty('--success', hexToHSL(brandingConfig.success_color));
    root.style.setProperty('--background', hexToHSL(brandingConfig.background_color));
  };
  
  const resetToOriginalTheme = () => {
    const root = document.documentElement;
    // Remove custom properties to revert to CSS defaults
    root.style.removeProperty('--primary');
    root.style.removeProperty('--success');
    root.style.removeProperty('--background');
  };

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('branding_config')
        .update({
          logo_url: config.logo_url,
          logo_white_url: config.logo_white_url,
          logo_black_url: config.logo_black_url,
          logo_light_url: config.logo_light_url,
          background_color: config.background_color,
          primary_color: config.primary_color,
          success_color: config.success_color,
          active_theme: config.active_theme,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;

      // Apply changes immediately
      applyThemeToDocument(config);
      
      // Save custom theme colors if active_theme is 'custom'
      if (config.active_theme === 'custom') {
        setCustomThemeColors({
          background_color: config.background_color,
          primary_color: config.primary_color,
          success_color: config.success_color,
        });
      }
      
      // Save to history after successful save
      setHistory(prev => [...prev, { config, timestamp: Date.now() }]);
      
      toast({
        title: 'Sucesso!',
        description: 'Configurações de branding salvas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving branding config:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configurações de branding.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) {
      toast({
        title: 'Não há alterações para desfazer',
        variant: 'destructive',
      });
      return;
    }
    
    // Remove current state and restore previous
    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const previous = newHistory[newHistory.length - 1];
    
    setConfig(previous.config);
    setHistory(newHistory);
    applyThemeToDocument(previous.config);
    
    toast({
      title: 'Alterações desfeitas',
      description: 'Configuração anterior restaurada.',
    });
  };

  const handleLogoUpload = async (file: File, type: 'logo' | 'logo_white' | 'logo_black' | 'logo_light') => {
    if (!config) return;
    
    setUploading(prev => ({ ...prev, [type]: true }));
    
    // Prevent auto-logout by keeping the session alive
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: 'Erro',
        description: 'Sessão expirada. Faça login novamente.',
        variant: 'destructive',
      });
      setUploading(prev => ({ ...prev, [type]: false }));
      return;
    }
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (type === 'logo') updateData.logo_url = publicUrl;
      if (type === 'logo_white') updateData.logo_white_url = publicUrl;
      if (type === 'logo_black') updateData.logo_black_url = publicUrl;
      if (type === 'logo_light') updateData.logo_light_url = publicUrl;

      const { error } = await supabase
        .from('branding_config')
        .update(updateData)
        .eq('id', config.id);

      if (error) throw error;

      // Reload the branding config to ensure we have the latest data
      const { data: updatedConfig } = await supabase
        .from('branding_config')
        .select('*')
        .eq('id', config.id)
        .single();

      if (updatedConfig) {
        setConfig(updatedConfig);
        applyThemeToDocument(updatedConfig);
      }
      
      toast({
        title: 'Sucesso!',
        description: 'Logo atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload da logo.',
        variant: 'destructive',
      });
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const applyTheme = (themeName: 'theme1' | 'theme2' | 'whitemode' | 'custom') => {
    if (!config) return;
    
    // Save current state to history
    setHistory(prev => [...prev, { config, timestamp: Date.now() }]);
    
    let newConfig: BrandingConfig;
    
    if (themeName === 'custom') {
      // Apply saved custom theme colors
      newConfig = {
        ...config,
        background_color: customThemeColors?.background_color || config.background_color,
        primary_color: customThemeColors?.primary_color || config.primary_color,
        success_color: customThemeColors?.success_color || config.success_color,
        active_theme: themeName
      };
    } else {
      // Apply predefined theme colors
      const theme = THEMES[themeName];
      newConfig = {
        ...config,
        background_color: theme.background_color,
        primary_color: theme.primary_color,
        success_color: theme.success_color,
        active_theme: themeName
      };
    }
    
    setConfig(newConfig);
    applyThemeToDocument(newConfig, customThemeEnabled);
    
    const themeName_display = themeName === 'custom' ? 'Custom' : THEMES[themeName].name;
    toast({
      title: `${themeName_display} aplicado!`,
      description: 'Clique em "Salvar Alterações" para confirmar.',
    });
  };
  
  const handleThemeToggle = (enabled: boolean) => {
    setCustomThemeEnabled(enabled);
    if (enabled && config) {
      applyThemeToDocument(config, true);
    } else {
      resetToOriginalTheme();
    }
  };

  // Security check
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0 min-w-0">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
              <h1 className="text-3xl font-bold mb-2">Branding</h1>
              <p className="text-muted-foreground">
                Gerencie as logos e cores da plataforma
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUndo} disabled={history.length <= 1} variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Desfazer
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>

          {/* Quick Theme Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Temas Rápidos
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="theme-toggle" className="text-sm font-normal">
                    {customThemeEnabled ? 'Temas Personalizados Ativos' : 'Tema Original Ativo'}
                  </Label>
                  <Switch 
                    id="theme-toggle"
                    checked={customThemeEnabled}
                    onCheckedChange={handleThemeToggle}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 flex-wrap">
              <Button
                onClick={() => applyTheme('theme1')}
                variant={config.active_theme === 'theme1' ? 'default' : 'outline'}
                className="flex-1 min-w-[120px]"
                disabled={!customThemeEnabled}
              >
                {THEMES.theme1.name}
              </Button>
              <Button
                onClick={() => applyTheme('theme2')}
                variant={config.active_theme === 'theme2' ? 'default' : 'outline'}
                className="flex-1 min-w-[120px]"
                disabled={!customThemeEnabled}
              >
                {THEMES.theme2.name}
              </Button>
              <Button
                onClick={() => applyTheme('whitemode')}
                variant={config.active_theme === 'whitemode' ? 'default' : 'outline'}
                className="flex-1 min-w-[120px]"
                disabled={!customThemeEnabled}
              >
                {THEMES.whitemode.name}
              </Button>
              <Button
                onClick={() => applyTheme('custom')}
                variant={config.active_theme === 'custom' ? 'default' : 'outline'}
                className="flex-1 min-w-[120px]"
                disabled={!customThemeEnabled}
              >
                Custom
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Logos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Header Dark Background */}
                <div className="space-y-2">
                  <Label>Logo Header (fundo escuro)</Label>
                  <div className="flex items-center gap-4">
                    {config.logo_white_url && (
                      <div className="bg-gray-800 p-2 rounded">
                        <img src={config.logo_white_url} alt="Logo Header Dark" className="h-12 object-contain" key={config.logo_white_url} />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, 'logo_white');
                      }}
                      disabled={uploading.logo_white}
                    />
                  </div>
                </div>

                {/* Logo Header Light Background */}
                <div className="space-y-2">
                  <Label>Logo Header (fundo claro)</Label>
                  <div className="flex items-center gap-4">
                    {config.logo_black_url && (
                      <div className="bg-white p-2 rounded">
                        <img src={config.logo_black_url} alt="Logo Header Light" className="h-12 object-contain" key={config.logo_black_url} />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, 'logo_black');
                      }}
                      disabled={uploading.logo_black}
                    />
                  </div>
                </div>

                {/* Logo Rio (fundo escuro) */}
                <div className="space-y-2">
                  <Label>Logo Rio (fundo escuro)</Label>
                  <div className="flex items-center gap-4">
                    {config.logo_url && (
                      <div className="bg-gray-800 p-2 rounded">
                        <img src={config.logo_url} alt="Logo Rio Dark" className="h-12 object-contain" key={config.logo_url} />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, 'logo');
                      }}
                      disabled={uploading.logo}
                    />
                  </div>
                </div>

                {/* Logo Rio (fundo claro) */}
                <div className="space-y-2">
                  <Label>Logo Rio (fundo claro)</Label>
                  <div className="flex items-center gap-4">
                    {config.logo_light_url && (
                      <div className="bg-white p-2 rounded">
                        <img src={config.logo_light_url} alt="Logo Rio Light" className="h-12 object-contain" key={config.logo_light_url} />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, 'logo_light');
                      }}
                      disabled={uploading.logo_light}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Cores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Background Color */}
                <div className="space-y-2">
                  <Label>Cor de Fundo</Label>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded border border-border"
                      style={{ backgroundColor: config.background_color }}
                    />
                    <Input
                      type="color"
                      value={config.background_color}
                      onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                      className="w-24 h-12"
                    />
                    <Input
                      type="text"
                      value={config.background_color}
                      onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Primary Color (#ff2389) */}
                <div className="space-y-2">
                  <Label>Cor Primária (Fast, Botões)</Label>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded border border-border"
                      style={{ backgroundColor: config.primary_color }}
                    />
                    <Input
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      className="w-24 h-12"
                    />
                    <Input
                      type="text"
                      value={config.primary_color}
                      onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Success Color (#00ff90) */}
                <div className="space-y-2">
                  <Label>Cor de Sucesso (Sim, Positivo)</Label>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded border border-border"
                      style={{ backgroundColor: config.success_color }}
                    />
                    <Input
                      type="color"
                      value={config.success_color}
                      onChange={(e) => setConfig({ ...config, success_color: e.target.value })}
                      className="w-24 h-12"
                    />
                    <Input
                      type="text"
                      value={config.success_color}
                      onChange={(e) => setConfig({ ...config, success_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBranding;