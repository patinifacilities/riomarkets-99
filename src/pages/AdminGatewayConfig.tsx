import { useState } from 'react';
import { ArrowLeft, Settings, Save, AlertTriangle } from 'lucide-react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useToast } from '@/hooks/use-toast';

const AdminGatewayConfig = () => {
  const { gatewayId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  // Gateway configurations
  const gatewayConfigs = {
    pix: {
      name: 'PIX',
      description: 'Sistema de pagamentos instantâneos do Brasil',
      settings: {
        enabled: true,
        feePercent: 0,
        minAmount: 1,
        maxAmount: 100000,
        pixKey: '',
        bankCode: '',
        accountNumber: '',
        webhookUrl: ''
      }
    },
    stripe: {
      name: 'Stripe',
      description: 'Gateway internacional para cartões de crédito',
      settings: {
        enabled: false,
        feePercent: 3.9,
        fixedFee: 0.39,
        minAmount: 5,
        maxAmount: 50000,
        publicKey: '',
        secretKey: '',
        webhookSecret: ''
      }
    },
    mercadopago: {
      name: 'Mercado Pago',
      description: 'Gateway brasileiro multiplataforma',
      settings: {
        enabled: true,
        feePercent: 4.99,
        minAmount: 1,
        maxAmount: 25000,
        accessToken: '',
        publicKey: '',
        clientId: '',
        webhookUrl: ''
      }
    },
    crypto: {
      name: 'Crypto',
      description: 'Gateway para pagamentos em criptomoedas',
      settings: {
        enabled: true,
        feePercent: 1.5,
        minAmount: 10,
        maxAmount: 500000,
        walletAddress: '',
        apiKey: '',
        webhookUrl: ''
      }
    }
  };

  const [config, setConfig] = useState<any>(gatewayConfigs[gatewayId as keyof typeof gatewayConfigs]?.settings || {});
  const [gatewayName, setGatewayName] = useState(gatewayConfigs[gatewayId as keyof typeof gatewayConfigs]?.name || '');

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

  if (!gatewayId || !gatewayConfigs[gatewayId as keyof typeof gatewayConfigs]) {
    return <Navigate to="/admin/gateways" replace />;
  }

  const gateway = gatewayConfigs[gatewayId as keyof typeof gatewayConfigs];

  const handleSave = () => {
    toast({
      title: "Configurações salvas!",
      description: `As configurações do ${gateway.name} foram atualizadas.`,
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/admin/gateways" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar para Gateways
              </Link>
              <h1 className="text-3xl font-bold mb-2">Configurar {gateway.name}</h1>
              <p className="text-muted-foreground">
                {gateway.description}
              </p>
            </div>
            <Badge variant="destructive" className="text-xs">
              ADMIN
            </Badge>
          </div>

          <div className="space-y-6">
            {/* Status */}
            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Status e Configurações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="gatewayName">Nome do Gateway</Label>
                  <Input 
                    id="gatewayName"
                    value={gatewayName} 
                    onChange={(e) => setGatewayName(e.target.value)}
                    placeholder="Nome do gateway"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Gateway Ativo</Label>
                    <p className="text-sm text-muted-foreground">Ativar/desativar este meio de pagamento</p>
                  </div>
                  <Switch 
                    checked={config.enabled} 
                    onCheckedChange={(checked) => setConfig({...config, enabled: checked})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="feePercent">Taxa (%)</Label>
                    <Input 
                      id="feePercent"
                      type="number" 
                      value={config.feePercent} 
                      onChange={(e) => setConfig({...config, feePercent: parseFloat(e.target.value)})}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fixedFee">Taxa Fixa (R$)</Label>
                    <Input 
                      id="fixedFee"
                      type="number" 
                      value={config.fixedFee || 0} 
                      onChange={(e) => setConfig({...config, fixedFee: parseFloat(e.target.value)})}
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minAmount">Valor Mínimo (R$)</Label>
                    <Input 
                      id="minAmount"
                      type="number" 
                      value={config.minAmount} 
                      onChange={(e) => setConfig({...config, minAmount: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAmount">Valor Máximo (R$)</Label>
                    <Input 
                      id="maxAmount"
                      type="number" 
                      value={config.maxAmount} 
                      onChange={(e) => setConfig({...config, maxAmount: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Configuration */}
            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader>
                <CardTitle>Configurações de API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      Informações Sensíveis
                    </p>
                    <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80">
                      Essas informações são criptografadas e armazenadas com segurança.
                    </p>
                  </div>
                </div>

                {gatewayId === 'pix' && (
                  <>
                    <div>
                      <Label htmlFor="pixKey">Chave PIX</Label>
                      <Input 
                        id="pixKey"
                        value={config.pixKey || ''} 
                        onChange={(e) => setConfig({...config, pixKey: e.target.value})}
                        placeholder="sua@chavepix.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankCode">Código do Banco</Label>
                      <Input 
                        id="bankCode"
                        value={config.bankCode || ''} 
                        onChange={(e) => setConfig({...config, bankCode: e.target.value})}
                        placeholder="001"
                      />
                    </div>
                  </>
                )}

                {gatewayId === 'stripe' && (
                  <>
                    <div>
                      <Label htmlFor="publicKey">Chave Pública</Label>
                      <Input 
                        id="publicKey"
                        value={config.publicKey || ''} 
                        onChange={(e) => setConfig({...config, publicKey: e.target.value})}
                        placeholder="pk_test_..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="secretKey">Chave Secreta</Label>
                      <Input 
                        id="secretKey"
                        type="password"
                        value={config.secretKey || ''} 
                        onChange={(e) => setConfig({...config, secretKey: e.target.value})}
                        placeholder="sk_test_..."
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <Input 
                    id="webhookUrl"
                    value={config.webhookUrl || ''} 
                    onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Salvar Configurações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGatewayConfig;