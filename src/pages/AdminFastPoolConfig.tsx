import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Settings } from 'lucide-react';
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

const AdminFastPoolConfig = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState({
    asset_name: '',
    asset_symbol: '',
    api_connected: false,
    api_url: '',
    api_key: '',
    webhook_url: '',
    base_odds: 1.65
  });

  useEffect(() => {
    if (assetId) {
      loadConfig();
    }
  }, [assetId]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('fast_pool_configs')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error) throw error;
      
      if (data) {
        setConfig({
          asset_name: data.asset_name || '',
          asset_symbol: data.asset_symbol || '',
          api_connected: data.api_connected || false,
          api_url: data.api_url || '',
          api_key: data.api_key || '',
          webhook_url: data.webhook_url || '',
          base_odds: data.base_odds || 1.65
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configuração",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('fast_pool_configs')
        .update({
          api_connected: config.api_connected,
          api_url: config.api_url,
          api_key: config.api_key,
          webhook_url: config.webhook_url,
          base_odds: config.base_odds,
          updated_at: new Date().toISOString()
        })
        .eq('id', assetId);

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: "As alterações foram aplicadas com sucesso",
      });

      navigate('/admin/fast');
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configuração",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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

  if (loading) {
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
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link to="/admin/fast" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Configuração de API</h1>
            <p className="text-muted-foreground">
              Configure a conexão de API para {config.asset_name} ({config.asset_symbol})
            </p>
          </div>

          <Card className="bg-card-secondary border-border-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações de Conexão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="api-connected" className="text-base font-semibold">API Conectada</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar conexão personalizada com API externa
                  </p>
                </div>
                <Switch
                  id="api-connected"
                  checked={config.api_connected}
                  onCheckedChange={(checked) => setConfig({ ...config, api_connected: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-url">URL da API</Label>
                <Input
                  id="api-url"
                  value={config.api_url}
                  onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
                  placeholder="https://api.exemplo.com/price"
                  disabled={!config.api_connected}
                />
                <p className="text-xs text-muted-foreground">
                  URL completa para buscar o preço do ativo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key (Opcional)</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  placeholder="Chave de autenticação da API"
                  disabled={!config.api_connected}
                />
                <p className="text-xs text-muted-foreground">
                  Chave de autenticação, se necessária
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL (Opcional)</Label>
                <Input
                  id="webhook-url"
                  value={config.webhook_url}
                  onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
                  placeholder="https://seu-servidor.com/webhook"
                  disabled={!config.api_connected}
                />
                <p className="text-xs text-muted-foreground">
                  URL para receber notificações de resultados
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base-odds">Odds Base</Label>
                <Input
                  id="base-odds"
                  type="number"
                  step="0.01"
                  min="1.10"
                  max="5.00"
                  value={config.base_odds}
                  onChange={(e) => setConfig({ ...config, base_odds: parseFloat(e.target.value) || 1.65 })}
                />
                <p className="text-xs text-muted-foreground">
                  Odds base para este ativo (entre 1.10 e 5.00)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/fast')}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminFastPoolConfig;
