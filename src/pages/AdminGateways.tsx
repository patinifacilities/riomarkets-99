import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, Wallet, Shield, Settings, Check, X, 
  AlertTriangle, Key, Globe, Zap 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Gateway {
  id: string;
  name: string;
  type: 'pix' | 'crypto' | 'card';
  enabled: boolean;
  status: 'active' | 'inactive' | 'error';
  icon: any;
  description: string;
  fees: {
    deposit: string;
    withdrawal: string;
  };
}

const AdminGateways = () => {
  const { toast } = useToast();
  
  const [gateways, setGateways] = useState<Gateway[]>([
    {
      id: 'pix',
      name: 'PIX',
      type: 'pix',
      enabled: true,
      status: 'active',
      icon: Zap,
      description: 'Sistema de pagamentos instantâneos brasileiro',
      fees: { deposit: '0%', withdrawal: '2%' }
    },
    {
      id: 'stripe',
      name: 'Stripe',
      type: 'card',
      enabled: false,
      status: 'inactive',
      icon: CreditCard,
      description: 'Processamento de cartões de crédito/débito',
      fees: { deposit: '3.9% + R$0.39', withdrawal: 'N/A' }
    },
    {
      id: 'crypto',
      name: 'Crypto Wallet',
      type: 'crypto',
      enabled: false,
      status: 'error',
      icon: Wallet,
      description: 'Pagamentos em criptomoedas (BTC, ETH, USDT)',
      fees: { deposit: '1%', withdrawal: '1.5%' }
    }
  ]);

  const [pixSettings, setPixSettings] = useState({
    merchantId: '',
    secretKey: '',
    webhookUrl: 'https://api.riomarkets.com/webhooks/pix',
    autoApprove: true
  });

  const [stripeSettings, setStripeSettings] = useState({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    currency: 'BRL'
  });

  const [cryptoSettings, setCryptoSettings] = useState({
    btcAddress: '',
    ethAddress: '',
    usdtAddress: '',
    apiKey: '',
    confirmations: 3
  });

  const toggleGateway = (gatewayId: string) => {
    setGateways(prev => prev.map(gateway => 
      gateway.id === gatewayId 
        ? { ...gateway, enabled: !gateway.enabled, status: !gateway.enabled ? 'active' : 'inactive' }
        : gateway
    ));
    
    const gateway = gateways.find(g => g.id === gatewayId);
    toast({
      title: `${gateway?.name} ${gateway?.enabled ? 'desabilitado' : 'habilitado'}`,
      description: `Gateway ${gateway?.enabled ? 'desativado' : 'ativado'} com sucesso`,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, text: 'Ativo', icon: Check },
      inactive: { variant: 'secondary' as const, text: 'Inativo', icon: X },
      error: { variant: 'destructive' as const, text: 'Erro', icon: AlertTriangle }
    };
    
    const config = variants[status as keyof typeof variants] || variants.inactive;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const savePixSettings = () => {
    toast({
      title: "Configurações PIX salvas",
      description: "As configurações do PIX foram atualizadas com sucesso",
    });
  };

  const saveStripeSettings = () => {
    toast({
      title: "Configurações Stripe salvas",
      description: "As configurações do Stripe foram atualizadas com sucesso",
    });
  };

  const saveCryptoSettings = () => {
    toast({
      title: "Configurações Crypto salvas",
      description: "As configurações de criptomoedas foram atualizadas com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gateways de Pagamento</h1>
          <p className="text-muted-foreground">
            Configure e gerencie métodos de pagamento da plataforma
          </p>
        </div>
      </div>

      {/* Gateways Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gateways.map((gateway) => {
          const Icon = gateway.icon;
          return (
            <Card key={gateway.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{gateway.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {gateway.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(gateway.status)}
                    <Switch
                      checked={gateway.enabled}
                      onCheckedChange={() => toggleGateway(gateway.id)}
                    />
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa depósito:</span>
                    <span className="font-medium">{gateway.fees.deposit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa saque:</span>
                    <span className="font-medium">{gateway.fees.withdrawal}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gateway Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações dos Gateways
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pix" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pix">PIX</TabsTrigger>
              <TabsTrigger value="stripe">Stripe</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
            </TabsList>

            <TabsContent value="pix" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pix-merchant">Merchant ID</Label>
                  <Input
                    id="pix-merchant"
                    value={pixSettings.merchantId}
                    onChange={(e) => setPixSettings(prev => ({ ...prev, merchantId: e.target.value }))}
                    placeholder="Seu Merchant ID do provedor PIX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pix-secret">Secret Key</Label>
                  <Input
                    id="pix-secret"
                    type="password"
                    value={pixSettings.secretKey}
                    onChange={(e) => setPixSettings(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder="Chave secreta do provedor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pix-webhook">Webhook URL</Label>
                  <Input
                    id="pix-webhook"
                    value={pixSettings.webhookUrl}
                    onChange={(e) => setPixSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="URL para receber notificações"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="pix-auto-approve"
                    checked={pixSettings.autoApprove}
                    onCheckedChange={(checked) => setPixSettings(prev => ({ ...prev, autoApprove: checked }))}
                  />
                  <Label htmlFor="pix-auto-approve">Auto-aprovar depósitos</Label>
                </div>
              </div>
              <Button onClick={savePixSettings} className="w-full md:w-auto">
                Salvar Configurações PIX
              </Button>
            </TabsContent>

            <TabsContent value="stripe" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-public">Publishable Key</Label>
                  <Input
                    id="stripe-public"
                    value={stripeSettings.publishableKey}
                    onChange={(e) => setStripeSettings(prev => ({ ...prev, publishableKey: e.target.value }))}
                    placeholder="pk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-secret">Secret Key</Label>
                  <Input
                    id="stripe-secret"
                    type="password"
                    value={stripeSettings.secretKey}
                    onChange={(e) => setStripeSettings(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder="sk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-webhook">Webhook Secret</Label>
                  <Input
                    id="stripe-webhook"
                    type="password"
                    value={stripeSettings.webhookSecret}
                    onChange={(e) => setStripeSettings(prev => ({ ...prev, webhookSecret: e.target.value }))}
                    placeholder="whsec_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-currency">Moeda</Label>
                  <Input
                    id="stripe-currency"
                    value={stripeSettings.currency}
                    onChange={(e) => setStripeSettings(prev => ({ ...prev, currency: e.target.value }))}
                    placeholder="BRL"
                  />
                </div>
              </div>
              <Button onClick={saveStripeSettings} className="w-full md:w-auto">
                Salvar Configurações Stripe
              </Button>
            </TabsContent>

            <TabsContent value="crypto" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crypto-btc">Endereço Bitcoin</Label>
                  <Input
                    id="crypto-btc"
                    value={cryptoSettings.btcAddress}
                    onChange={(e) => setCryptoSettings(prev => ({ ...prev, btcAddress: e.target.value }))}
                    placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crypto-eth">Endereço Ethereum</Label>
                  <Input
                    id="crypto-eth"
                    value={cryptoSettings.ethAddress}
                    onChange={(e) => setCryptoSettings(prev => ({ ...prev, ethAddress: e.target.value }))}
                    placeholder="0x742d35Cc6434C0532925a3b8C17c111..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crypto-usdt">Endereço USDT</Label>
                  <Input
                    id="crypto-usdt"
                    value={cryptoSettings.usdtAddress}
                    onChange={(e) => setCryptoSettings(prev => ({ ...prev, usdtAddress: e.target.value }))}
                    placeholder="0x742d35Cc6434C0532925a3b8C17c111..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crypto-api">API Key</Label>
                  <Input
                    id="crypto-api"
                    type="password"
                    value={cryptoSettings.apiKey}
                    onChange={(e) => setCryptoSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Chave da API do provedor crypto"
                  />
                </div>
              </div>
              <Button onClick={saveCryptoSettings} className="w-full md:w-auto">
                Salvar Configurações Crypto
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-warning">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <h4 className="font-semibold text-warning mb-1">Aviso de Segurança</h4>
              <p className="text-sm text-muted-foreground">
                Mantenha suas chaves de API e secrets seguros. Nunca compartilhe essas informações e 
                sempre use conexões HTTPS em produção. Configure webhooks apenas para URLs confiáveis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGateways;