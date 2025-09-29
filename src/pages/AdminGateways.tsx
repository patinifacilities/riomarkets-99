import { ArrowLeft, CreditCard, Globe, Shield, Settings } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useState } from 'react';

const AdminGateways = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
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

  const gateways = [
    {
      id: 'pix',
      name: 'PIX',
      status: true,
      description: 'Sistema de pagamentos instantâneos do Brasil',
      icon: <Globe className="w-5 h-5" />,
      fees: '0%',
      limits: 'R$ 1,00 - R$ 100.000,00'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      status: false,
      description: 'Gateway internacional para cartões de crédito',
      icon: <CreditCard className="w-5 h-5" />,
      fees: '3.9% + R$ 0,39',
      limits: 'R$ 5,00 - R$ 50.000,00'
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      status: true,
      description: 'Gateway brasileiro multiplataforma',
      icon: <Shield className="w-5 h-5" />,
      fees: '4.99%',
      limits: 'R$ 1,00 - R$ 25.000,00'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
              <h1 className="text-3xl font-bold mb-2">Gateways de Pagamento</h1>
              <p className="text-muted-foreground">
                Configurar e gerenciar meios de pagamento da plataforma
              </p>
            </div>
            <Badge variant="destructive" className="text-xs">
              ADMIN
            </Badge>
          </div>

          <div className="grid gap-6">
            {gateways.map((gateway) => (
              <Card key={gateway.id} className="bg-card-secondary border-border-secondary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {gateway.icon}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {gateway.name}
                          <Badge variant={gateway.status ? "default" : "secondary"}>
                            {gateway.status ? "Ativo" : "Inativo"}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {gateway.description}
                        </p>
                      </div>
                    </div>
                    <Switch checked={gateway.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium mb-1">Taxas</h4>
                      <p className="text-sm text-muted-foreground">{gateway.fees}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Limites</h4>
                      <p className="text-sm text-muted-foreground">{gateway.limits}</p>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Configurar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <Card className="mt-8 bg-card-secondary border-border-secondary">
            <CardHeader>
              <CardTitle>Resumo dos Gateways</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">2</div>
                  <p className="text-sm text-muted-foreground">Gateways Ativos</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">1</div>
                  <p className="text-sm text-muted-foreground">Gateways Inativos</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">R$ 100K</div>
                  <p className="text-sm text-muted-foreground">Limite Máximo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminGateways;