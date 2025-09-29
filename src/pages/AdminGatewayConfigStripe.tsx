import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Save } from 'lucide-react';
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

const AdminGatewayConfigStripe = () => {
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
    enabled: false,
    publishableKey: 'pk_test_...',
    secretKey: 'sk_test_...',
    feePercent: 3.9,
    fixedFee: 0.39,
    minAmount: 5,
    maxAmount: 50000,
    webhookUrl: 'https://api.riozmarkets.com/webhook/stripe'
  });

  const handleSave = () => {
    // Simulate saving
    toast({
      title: "Configurações salvas!",
      description: "As configurações do Stripe foram atualizadas com sucesso.",
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
                  <CreditCard className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold">Configuração Stripe</h1>
              </div>
              <p className="text-muted-foreground">
                Gateway internacional para cartões de crédito
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
                    <p className="text-sm text-muted-foreground">Habilitar/desabilitar o Stripe</p>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label htmlFor="fixedFee">Taxa Fixa (R$)</Label>
                    <Input
                      id="fixedFee"
                      type="number"
                      step="0.01"
                      value={config.fixedFee}
                      onChange={(e) => setConfig(prev => ({ ...prev, fixedFee: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minAmount">Valor Mínimo (R$)</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      value={config.minAmount}
                      onChange={(e) => setConfig(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 5 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAmount">Valor Máximo (R$)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      value={config.maxAmount}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || 50000 }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações Stripe */}
            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader>
                <CardTitle>Configurações Stripe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="publishableKey">Publishable Key</Label>
                  <Input
                    id="publishableKey"
                    type="text"
                    value={config.publishableKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, publishableKey: e.target.value }))}
                    placeholder="pk_test_..."
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Chave pública do Stripe (segura para usar no frontend)
                  </p>
                </div>

                <div>
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <Input
                    id="secretKey"
                    type="password"
                    value={config.secretKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder="sk_test_..."
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Chave secreta do Stripe (mantenha segura)
                  </p>
                </div>

                <div>
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://api.riozmarkets.com/webhook/stripe"
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

export default AdminGatewayConfigStripe;