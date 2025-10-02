import { useState, useEffect } from 'react';
import { ArrowLeft, Globe, Save } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useToast } from '@/hooks/use-toast';

const AdminGatewayConfigPix = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();
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
    provider: 'abacatepay',
    apiKey: '',
    pixKey: 'exemplo@pix.com.br',
    feePercent: 0,
    minAmount: 1,
    maxAmount: 100000,
    webhookUrl: 'https://api.riozmarkets.com/webhook/pix'
  });

  const handleSave = () => {
    // Simulate saving
    toast({
      title: "Configurações salvas!",
      description: "As configurações do PIX foram atualizadas com sucesso.",
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
                  <Globe className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold">Configuração PIX</h1>
              </div>
              <p className="text-muted-foreground">
                Sistema de pagamentos instantâneos do Brasil
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
                    <p className="text-sm text-muted-foreground">Habilitar/desabilitar o PIX</p>
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
                      onChange={(e) => setConfig(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAmount">Valor Máximo (R$)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      value={config.maxAmount}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || 100000 }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Provedor e API */}
            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader>
                <CardTitle>Provedor de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="provider">Provedor PIX</Label>
                  <Select value={config.provider} onValueChange={(value) => setConfig(prev => ({ ...prev, provider: value }))}>
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Selecione o provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abacatepay">Abacatepay</SelectItem>
                      <SelectItem value="mercadopago">Mercado Pago (Em breve)</SelectItem>
                      <SelectItem value="pagseguro">PagSeguro (Em breve)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sistema de pagamentos PIX utilizado
                  </p>
                </div>

                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Sua API Key do provedor"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.provider === 'abacatepay' && 'Obtida no painel da Abacatepay'}
                    {config.provider === 'mercadopago' && 'Obtida no painel do Mercado Pago'}
                    {config.provider === 'pagseguro' && 'Obtida no painel do PagSeguro'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://api.riozmarkets.com/webhook/pix"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    URL para receber notificações de pagamento
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

export default AdminGatewayConfigPix;