import { useState, useEffect } from 'react';
import { Link, Navigate, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Badge } from '@/components/ui/badge';

// API configurations for each asset
const API_CONFIGS = {
  rioz: {
    name: 'Rioz Coin (USD)',
    endpoint: 'https://api.exchangerate-api.com/v4/latest/USD',
    description: 'Cotação do dólar americano em tempo real (1 RIOZ = 1 USD)',
    priceField: 'rates.BRL',
  },
  btc: {
    name: 'Bitcoin',
    endpoint: 'https://api.coinbase.com/v2/exchange-rates?currency=BTC',
    description: 'Preço do Bitcoin via Coinbase (baixa latência)',
    priceField: 'data.rates.USD',
  },
  usdt: {
    name: 'Tether',
    endpoint: 'https://api.coinbase.com/v2/exchange-rates?currency=USDT',
    description: 'Preço do USDT via Coinbase',
    priceField: 'data.rates.USD',
  },
  usdc: {
    name: 'USD Coin',
    endpoint: 'https://api.coinbase.com/v2/exchange-rates?currency=USDC',
    description: 'Preço do USDC via Coinbase',
    priceField: 'data.rates.USD',
  },
};

const AdminExchangeApiConfig = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [priceField, setPriceField] = useState('');
  const [testingApi, setTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const config = API_CONFIGS[symbol as keyof typeof API_CONFIGS];

  useEffect(() => {
    if (config) {
      setApiUrl(config.endpoint);
      setPriceField(config.priceField);
    }
  }, [config]);

  const testApiEndpoint = async () => {
    setTestingApi(true);
    setTestResult(null);
    
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      // Try to extract price from the field path
      const fieldPath = priceField.split('.');
      let price = data;
      for (const field of fieldPath) {
        price = price?.[field];
      }
      
      setTestResult({
        success: true,
        data,
        extractedPrice: price,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "✅ API testada com sucesso!",
        description: `Preço extraído: ${price || 'N/A'}`,
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      
      toast({
        title: "Erro ao testar API",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setTestingApi(false);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    
    try {
      // Save to database (you can create a table for this or use existing system_config)
      const { error } = await supabase
        .from('exchange_asset_api_config')
        .upsert({
          symbol: symbol?.toUpperCase(),
          api_url: apiUrl,
          price_field: priceField,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "✅ Configuração salva!",
        description: "A API foi configurada com sucesso.",
      });
      
      // Go back to exchange admin
      navigate('/admin/exchange');
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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
    return <Navigate to="/" replace />;
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Ativo não encontrado</h2>
          <p className="text-muted-foreground mb-4">O ativo {symbol} não existe.</p>
          <Button onClick={() => navigate('/admin/exchange')}>
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0 min-w-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link to="/admin/exchange" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar para Exchange
            </Link>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Configurar API - {config.name}</h1>
                <p className="text-muted-foreground">
                  {config.description}
                </p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {symbol?.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="space-y-6">
            {/* API Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Endpoint da API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="api-url">URL do Endpoint</Label>
                  <Input
                    id="api-url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://api.example.com/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Endpoint que retorna os dados de cotação em tempo real
                  </p>
                </div>

                <div>
                  <Label htmlFor="price-field">Campo do Preço (JSON Path)</Label>
                  <Input
                    id="price-field"
                    value={priceField}
                    onChange={(e) => setPriceField(e.target.value)}
                    placeholder="data.rates.USD"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Caminho para o campo de preço no JSON retornado (ex: data.rates.USD)
                  </p>
                </div>

                <Button 
                  onClick={testApiEndpoint}
                  disabled={testingApi || !apiUrl || !priceField}
                  variant="outline"
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {testingApi ? 'Testando...' : 'Testar API'}
                </Button>
              </CardContent>
            </Card>

            {/* Test Results */}
            {testResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultado do Teste</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResult.success ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500">Sucesso</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(testResult.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Preço Extraído:</p>
                        <p className="text-2xl font-bold">{testResult.extractedPrice || 'N/A'}</p>
                      </div>

                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-medium mb-2">Ver resposta completa</summary>
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Badge variant="destructive">Erro</Badge>
                      <p className="text-sm text-red-500">{testResult.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/exchange')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={saveConfiguration}
                disabled={saving || !apiUrl || !priceField}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            </div>

            {/* Information Box */}
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Sobre as APIs Configuradas
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Coinbase API:</strong> Baixa latência, atualização a cada segundo</li>
                  <li>• <strong>ExchangeRate API:</strong> Dados confiáveis para conversão USD/BRL</li>
                  <li>• <strong>Rioz = USD:</strong> 1 Rioz Coin equivale a 1 Dólar Americano</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExchangeApiConfig;
