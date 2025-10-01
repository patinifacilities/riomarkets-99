import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface ApiConfig {
  asset_symbol: string;
  asset_name: string;
  api_url?: string;
  api_key?: string;
  api_connected: boolean;
}

const AdminFastApiConfig = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchApiConfigs();
    }
  }, [user]);

  const fetchApiConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('fast_pool_configs')
        .select('asset_symbol, asset_name, api_url, api_key, api_connected')
        .order('asset_name');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching API configs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de API",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (assetSymbol: string, apiUrl: string, apiKey: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('fast_pool_configs')
        .update({
          api_url: apiUrl || null,
          api_key: apiKey || null,
          api_connected: !!apiUrl
        })
        .eq('asset_symbol', assetSymbol);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração de API salva com sucesso"
      });

      fetchApiConfigs();
    } catch (error) {
      console.error('Error saving API config:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração de API",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (assetSymbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-market-data', {
        body: { symbols: [assetSymbol] }
      });

      if (error) throw error;

      const price = data?.prices?.[assetSymbol];
      if (price) {
        toast({
          title: "Conexão OK",
          description: `Preço atual: $${price.toLocaleString()}`
        });
      } else {
        throw new Error('Preço não disponível');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar à API",
        variant: "destructive"
      });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0 min-w-0">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link 
                to="/admin/fast" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para Fast Pools
              </Link>
              <h1 className="text-3xl font-bold mb-2">Configuração de APIs</h1>
              <p className="text-muted-foreground">
                Configure as APIs usadas para obter preços em tempo real dos ativos
              </p>
            </div>
          </div>

          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              As configurações de API são usadas tanto para o card "Preço ao Vivo" quanto para 
              determinar o preço dos ativos nos pools. As conexões com Binance (BTC, ETH, SOL, GOLD, SILVER) 
              são automáticas via WebSocket. Para outros ativos, configure a API abaixo.
            </AlertDescription>
          </Alert>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <Card key={config.asset_symbol} className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        <span className="text-lg">{config.asset_name}</span>
                        <span className="text-sm text-muted-foreground ml-2">({config.asset_symbol})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {config.api_connected ? (
                          <span className="text-xs px-2 py-1 bg-[#00ff90]/10 text-[#00ff90] rounded">
                            Conectado
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                            Não configurado
                          </span>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const apiUrl = formData.get('api_url') as string;
                        const apiKey = formData.get('api_key') as string;
                        handleSaveConfig(config.asset_symbol, apiUrl, apiKey);
                      }}
                      className="space-y-4"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`api_url_${config.asset_symbol}`}>URL da API</Label>
                          <Input
                            id={`api_url_${config.asset_symbol}`}
                            name="api_url"
                            type="url"
                            placeholder="https://api.example.com/price"
                            defaultValue={config.api_url || ''}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`api_key_${config.asset_symbol}`}>API Key (opcional)</Label>
                          <Input
                            id={`api_key_${config.asset_symbol}`}
                            name="api_key"
                            type="password"
                            placeholder="Sua chave de API"
                            defaultValue={config.api_key || ''}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={saving}>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Configuração
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => handleTestConnection(config.asset_symbol)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Testar Conexão
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFastApiConfig;
