import { useState, useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Zap, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface PoolConfig {
  id: string;
  asset_symbol: string;
  asset_name: string;
  category: string;
  api_url?: string;
  api_key?: string;
  webhook_url?: string;
  api_connected: boolean;
  last_api_sync?: string;
}

const AdminFastPoolConfig = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [poolConfig, setPoolConfig] = useState<PoolConfig | null>(null);
  const [formData, setFormData] = useState({
    api_url: '',
    api_key: '',
    webhook_url: ''
  });

  useEffect(() => {
    if (user && poolId) {
      fetchPoolConfig();
    }
  }, [user, poolId]);

  const fetchPoolConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('fast_pools')
        .select('id, asset_symbol, asset_name, category, api_url, api_key, webhook_url, api_connected, last_api_sync')
        .eq('id', poolId)
        .single();

      if (error) throw error;
      
      setPoolConfig(data);
      setFormData({
        api_url: data.api_url || '',
        api_key: data.api_key || '',
        webhook_url: data.webhook_url || ''
      });
    } catch (error) {
      console.error('Error fetching pool config:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações do pool",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('fast_pools')
        .update({
          api_url: formData.api_url || null,
          api_key: formData.api_key || null,
          webhook_url: formData.webhook_url || null,
          api_connected: !!(formData.api_url && formData.api_key)
        })
        .eq('id', poolId);

      if (error) throw error;

      toast({
        title: "Configuração salva!",
        description: "As configurações de API foram atualizadas com sucesso."
      });

      fetchPoolConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.api_url) {
      toast({
        title: "URL obrigatória",
        description: "Por favor, insira a URL da API",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (formData.api_key) {
        headers['Authorization'] = `Bearer ${formData.api_key}`;
      }

      const response = await fetch(formData.api_url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      
      toast({
        title: "Conexão bem-sucedida!",
        description: `API respondeu com sucesso. Dados recebidos: ${JSON.stringify(data).substring(0, 100)}...`
      });

      // Update last sync time
      await supabase
        .from('fast_pools')
        .update({ last_api_sync: new Date().toISOString() })
        .eq('id', poolId);

      fetchPoolConfig();
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Erro na conexão",
        description: error instanceof Error ? error.message : "Falha ao conectar com a API",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
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
          <div className="mb-8">
            <Link to="/admin/fast" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar para Fast Pools
            </Link>
            <h1 className="text-3xl font-bold mb-2">Configuração do Pool</h1>
            {poolConfig && (
              <div className="flex items-center gap-2 mt-2">
                <p className="text-muted-foreground">
                  {poolConfig.asset_name} ({poolConfig.asset_symbol})
                </p>
                {poolConfig.api_connected && (
                  <Badge className="bg-success/10 text-success">
                    API Conectada
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* API Configuration Card */}
          <Card className="bg-card-secondary border-border-secondary mb-6">
            <CardHeader>
              <CardTitle>Configuração de API Externa</CardTitle>
              <CardDescription>
                Conecte uma API externa para receber dados de mercado em tempo real. Enquanto não houver API conectada, o sistema usará dados de mercado padrão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api_url">URL da API</Label>
                <Input
                  id="api_url"
                  placeholder="https://api.example.com/market-data"
                  value={formData.api_url}
                  onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Endpoint que retorna dados de preço e horário
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">Chave de API (opcional)</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="sk_..."
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Token de autenticação para a API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">URL do Webhook (opcional)</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://api.example.com/webhook"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  URL para receber atualizações em tempo real
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Configuração'}
                </Button>
                
                <Button 
                  onClick={handleTestConnection}
                  disabled={testing || !formData.api_url}
                  variant="outline"
                  className="gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {testing ? 'Testando...' : 'Testar Conexão'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="bg-card-secondary border-border-secondary">
            <CardHeader>
              <CardTitle>Status da API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status da Conexão</span>
                <Badge className={poolConfig?.api_connected ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>
                  {poolConfig?.api_connected ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
              
              {poolConfig?.last_api_sync && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Última Sincronização</span>
                  <span className="text-sm">{new Date(poolConfig.last_api_sync).toLocaleString('pt-BR')}</span>
                </div>
              )}

              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {poolConfig?.api_connected 
                    ? '✓ API externa conectada. Os dados de mercado serão obtidos da API configurada.'
                    : '⚠️ Nenhuma API conectada. O sistema está usando dados de mercado padrão.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminFastPoolConfig;
