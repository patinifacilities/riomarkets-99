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
  const [selectedTheme, setSelectedTheme] = useState<'original' | 'custom'>('custom');

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
      }
    } catch (error) {
      console.error('Error fetching branding config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const updateData = {
        logo_url: config.logo_url,
        logo_white_url: config.logo_white_url,
        logo_black_url: config.logo_black_url,
        logo_light_url: config.logo_light_url,
        active_theme: selectedTheme,
        updated_at: new Date().toISOString()
      };

      // Only include color changes if custom theme is selected
      if (selectedTheme === 'custom') {
        Object.assign(updateData, {
          background_color: config.background_color,
          primary_color: config.primary_color,
          success_color: config.success_color,
        });
      }

      const { error } = await supabase
        .from('branding_config')
        .update(updateData)
        .eq('id', config.id);

      if (error) throw error;

      // Reload page to apply theme changes
      window.location.reload();
      
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

  const handleThemeChange = (theme: 'original' | 'custom') => {
    setSelectedTheme(theme);
    if (theme === 'original') {
      // Reset to original colors
      setConfig(prev => prev ? {
        ...prev,
        background_color: '#0A101A',
        primary_color: '#ff2389',
        success_color: '#00ff90'
      } : null);
    }
  };

  const handleLogoUpload = async (file: File, type: 'logo' | 'logo_white' | 'logo_black' | 'logo_light') => {
    if (!config) return;
    
    setUploading(prev => ({ ...prev, [type]: true }));
    
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

      const { data: updatedConfig } = await supabase
        .from('branding_config')
        .select('*')
        .eq('id', config.id)
        .single();

      if (updatedConfig) {
        setConfig(updatedConfig);
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
                Gerencie as logos da plataforma
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>

          {/* Theme Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Seleção de Tema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={selectedTheme === 'original' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('original')}
                  className="h-auto py-4"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    <span className="font-semibold">Tema Original</span>
                    <span className="text-xs text-muted-foreground">Cores padrão do sistema</span>
                  </div>
                </Button>
                <Button
                  variant={selectedTheme === 'custom' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('custom')}
                  className="h-auto py-4"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Palette className="w-6 h-6" />
                    <span className="font-semibold">Tema Custom</span>
                    <span className="text-xs text-muted-foreground">Personalize as cores</span>
                  </div>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedTheme === 'original' 
                  ? 'O tema original usa as cores padrão do sistema. O modo claro/escuro funcionará normalmente.'
                  : 'O tema custom permite personalizar background e cores principais. O modo claro/escuro funcionará normalmente.'}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Color Customization */}
            <Card className={selectedTheme === 'original' ? 'opacity-50 pointer-events-none' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Cores do Site
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bg-color">Cor de Fundo (Background)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="bg-color"
                      type="color"
                      value={config.background_color}
                      onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={config.background_color}
                      onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                      className="flex-1"
                      placeholder="#0A101A"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary-color">Cor Principal (Accent)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="primary-color"
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={config.primary_color}
                      onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      className="flex-1"
                      placeholder="#ff2389"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="success-color">Cor de Sucesso</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="success-color"
                      type="color"
                      value={config.success_color}
                      onChange={(e) => setConfig({ ...config, success_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={config.success_color}
                      onChange={(e) => setConfig({ ...config, success_color: e.target.value })}
                      className="flex-1"
                      placeholder="#00ff90"
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Preview</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div 
                      className="h-12 rounded border border-border flex items-center justify-center text-xs"
                      style={{ backgroundColor: config.background_color, color: '#fff' }}
                    >
                      Background
                    </div>
                    <div 
                      className="h-12 rounded border border-border flex items-center justify-center text-xs text-white"
                      style={{ backgroundColor: config.primary_color }}
                    >
                      Primary
                    </div>
                    <div 
                      className="h-12 rounded border border-border flex items-center justify-center text-xs text-black"
                      style={{ backgroundColor: config.success_color }}
                    >
                      Success
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBranding;