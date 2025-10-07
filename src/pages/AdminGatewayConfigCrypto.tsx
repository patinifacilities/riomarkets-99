import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Save, Check } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useToast } from '@/hooks/use-toast';

const AdminGatewayConfigCrypto = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const [config, setConfig] = useState({
    enabled: true,
    apiUrl: 'https://a-api.coinpayments.net',
    clientId: 'd1219c256f7d4653b2b24759def7f66e',
    clientSecret: 'uhA4vISXjWF8cs/FsZf0ewSITf0WTqwnc+GDkgidj3c=',
    feePercent: 1.5,
    minAmount: 10,
    maxAmount: 500000,
    permissions: [
      'createinvoice',
      'listinvoices',
      'findinvoice',
      'invoicepayouts',
      'listinvoicehistory',
      'createwallet',
      'getwallets',
      'getwalletbyid',
      'createaddress',
      'getwalletaddresse',
      'getwalletaddresses',
      'getwallettransactions',
      'getwallettransaction',
      'spendrequest',
      'confirmspendingfunds',
      'createclientwebhook',
      'getwebhooks',
      'updatewebhook',
      'deletewebhook'
    ]
  });

  const handleSave = () => {
    // Simulate saving
    toast({
      title: "Configurações salvas!",
      description: "As configurações do gateway Crypto foram atualizadas com sucesso.",
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
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold">Configuração Crypto</h1>
              </div>
              <p className="text-muted-foreground">
                Gateway para pagamentos em criptomoedas
              </p>
            </div>
            <Badge variant="destructive" className="text-xs">
              ADMIN
            </Badge>
          </div>

          <div className="space-y-6">
            {/* Status e Configurações Básicas */}
            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader>
                <CardTitle>Status e Configurações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Gateway Ativo</Label>
                    <p className="text-sm text-muted-foreground">Habilitar/desabilitar pagamentos crypto</p>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="feePercent">Taxa (%)</Label>
                    <Input
                      id="feePercent"
                      type="number"
                      step="0.01"
                      value={config.feePercent}
                      onChange={(e) => setConfig(prev => ({ ...prev, feePercent: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minAmount">Valor Mínimo (R$)</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      value={config.minAmount}
                      onChange={(e) => setConfig(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 10 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAmount">Valor Máximo (R$)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      value={config.maxAmount}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || 500000 }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuração da API CoinPayments */}
            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader>
                <CardTitle>Configuração da API CoinPayments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    type="url"
                    value={config.apiUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                    placeholder="https://a-api.coinpayments.net"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    URL base da API CoinPayments
                  </p>
                </div>

                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    type="text"
                    value={config.clientId}
                    onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                    placeholder="d1219c256f7d4653b2b24759def7f66e"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    ID do cliente fornecido pela CoinPayments
                  </p>
                </div>

                <div>
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={config.clientSecret}
                    onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                    placeholder="••••••••••••••••••••••••••••••••"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Chave secreta do cliente (mantida confidencial)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Permissões da API */}
            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader>
                <CardTitle>Permissões da API</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Permissões configuradas para a integração CoinPayments
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: 'createinvoice', label: 'Create Invoice', description: 'Adiciona a permissão createinvoice' },
                    { id: 'listinvoices', label: 'List Invoices', description: 'Adiciona a permissão listinvoices' },
                    { id: 'findinvoice', label: 'Find Invoice', description: 'Adiciona a permissão findinvoice' },
                    { id: 'invoicepayouts', label: 'Invoice Payouts', description: 'Adiciona a permissão invoicepayouts' },
                    { id: 'listinvoicehistory', label: 'List Invoice History', description: 'Adiciona a permissão listinvoicehistory' },
                    { id: 'createwallet', label: 'Create Wallet', description: 'Adiciona a permissão createwallet' },
                    { id: 'getwallets', label: 'Get Wallets', description: 'Adiciona a permissão getwallets' },
                    { id: 'getwalletbyid', label: 'Get Wallet By ID', description: 'Adiciona a permissão getwalletbyid' },
                    { id: 'createaddress', label: 'Create Address', description: 'Adiciona a permissão createaddress' },
                    { id: 'getwalletaddresse', label: 'Get Wallet Address', description: 'Adiciona a permissão getwalletaddresse' },
                    { id: 'getwalletaddresses', label: 'Get Wallet Addresses', description: 'Adiciona a permissão getwalletaddresses' },
                    { id: 'getwallettransactions', label: 'Get Wallet Transactions', description: 'Adiciona a permissão getwallettransactions' },
                    { id: 'getwallettransaction', label: 'Get Wallet Transaction', description: 'Adiciona a permissão getwallettransaction' },
                    { id: 'spendrequest', label: 'Spend Request', description: 'Adiciona a permissão spendrequest' },
                    { id: 'confirmspendingfunds', label: 'Confirm Spending Funds', description: 'Adiciona a permissão confirmspendingfunds' },
                    { id: 'createclientwebhook', label: 'Create Client Webhook', description: 'Adiciona a permissão createclientwebhook' },
                    { id: 'getwebhooks', label: 'Get Webhooks', description: 'Adiciona a permissão getwebhooks' },
                    { id: 'updatewebhook', label: 'Update Webhook', description: 'Adiciona a permissão updatewebhook' },
                    { id: 'deletewebhook', label: 'Delete Webhook', description: 'Adiciona a permissão deletewebhook' }
                  ].map((permission) => (
                    <div
                      key={permission.id}
                      className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3"
                    >
                      <div className="mt-0.5 p-1 rounded-full bg-primary/20">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-foreground">{permission.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{permission.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    <span className="font-semibold text-success">Todas as permissões habilitadas</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    A integração tem acesso completo a todos os recursos da API CoinPayments
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Salvar Configurações */}
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

export default AdminGatewayConfigCrypto;