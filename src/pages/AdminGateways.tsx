import { ArrowLeft, CreditCard, Globe, Shield, Settings, BarChart3, TrendingUp, Plus, ArrowRightLeft } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AddGatewayModal } from '@/components/admin/AddGatewayModal';
import { useState } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell, Legend, Tooltip } from 'recharts';

const AdminGateways = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddGatewayModal, setShowAddGatewayModal] = useState(false);
  const [gatewayStatuses, setGatewayStatuses] = useState<Record<string, boolean>>({
    pix: true,
    stripe: false,
    mercadopago: true,
    crypto: true
  });

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
      status: gatewayStatuses.pix,
      description: 'Sistema de pagamentos instantâneos do Brasil',
      icon: <Globe className="w-5 h-5" />,
      fees: '0%',
      limits: 'R$ 1,00 - R$ 100.000,00',
      conversionRate: 98.5,
      usage: 65
    },
    {
      id: 'stripe',
      name: 'Stripe',
      status: gatewayStatuses.stripe,
      description: 'Gateway internacional para cartões de crédito',
      icon: <CreditCard className="w-5 h-5" />,
      fees: '3.9% + R$ 0,39',
      limits: 'R$ 5,00 - R$ 50.000,00',
      conversionRate: 94.2,
      usage: 25
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      status: gatewayStatuses.mercadopago,
      description: 'Gateway brasileiro multiplataforma',
      icon: <Shield className="w-5 h-5" />,
      fees: '4.99%',
      limits: 'R$ 1,00 - R$ 25.000,00',
      conversionRate: 95.8,
      usage: 10
    },
    {
      id: 'crypto',
      name: 'Crypto',
      status: gatewayStatuses.crypto,
      description: 'Gateway para pagamentos em criptomoedas',
      icon: <Shield className="w-5 h-5" />,
      fees: '1.5%',
      limits: 'R$ 10,00 - R$ 500.000,00',
      conversionRate: 99.1,
      usage: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 py-8 overflow-x-hidden">
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
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowAddGatewayModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Gateway
                </Button>
                <Link to="/admin/gateways-saque">
                  <Button 
                    variant="outline"
                    style={{ backgroundColor: '#00ff90', color: '#1a1a1a', borderColor: '#00ff90' }}
                    className="gap-2 hover:bg-[#00ff90]/90"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Gateways de Saque
                  </Button>
                </Link>
                <Badge variant="destructive" className="text-xs">
                  ADMIN
                </Badge>
              </div>
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
                    <Switch 
                      checked={gateway.status} 
                      onCheckedChange={(checked) => {
                        setGatewayStatuses(prev => ({
                          ...prev,
                          [gateway.id]: checked
                        }));
                      }}
                    />
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
                       <Link to={`/admin/gateway-config/${gateway.id}`}>
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="gap-2"
                         >
                           <Settings className="w-4 h-4" />
                           Configurar
                         </Button>
                       </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Conversion Rate Line Chart */}
            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Taxa de Conversão por Gateway
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  pix: { label: "PIX", color: "hsl(var(--chart-1))" },
                  stripe: { label: "Stripe", color: "hsl(var(--chart-2))" },
                  mercadopago: { label: "Mercado Pago", color: "hsl(var(--chart-3))" },
                  crypto: { label: "Crypto", color: "hsl(var(--chart-4))" }
                }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { month: 'Jan', pix: 98.5, stripe: 94.2, mercadopago: 96.8, crypto: 99.1 },
                      { month: 'Fev', pix: 98.8, stripe: 94.5, mercadopago: 97.1, crypto: 99.3 },
                      { month: 'Mar', pix: 98.3, stripe: 93.8, mercadopago: 96.5, crypto: 99.0 },
                      { month: 'Abr', pix: 98.7, stripe: 94.1, mercadopago: 96.9, crypto: 99.2 },
                      { month: 'Mai', pix: 98.9, stripe: 94.6, mercadopago: 97.2, crypto: 99.4 },
                      { month: 'Jun', pix: 98.6, stripe: 94.3, mercadopago: 97.0, crypto: 99.1 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[90, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="pix" stroke="#00ff90" strokeWidth={2} />
                      <Line type="monotone" dataKey="stripe" stroke="#ff6100" strokeWidth={2} />
                      <Line type="monotone" dataKey="mercadopago" stroke="#ff2389" strokeWidth={2} />
                      <Line type="monotone" dataKey="crypto" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Usage Bar Chart */}
            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Uso por Gateway
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  usage: { label: "Uso", color: "hsl(var(--chart-1))" }
                }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gateways.sort((a, b) => b.usage - a.usage).map((gateway, index) => ({
                      name: gateway.name,
                      usage: gateway.usage,
                      fill: index === 0 ? '#00ff90' : index === 1 ? '#ff2389' : '#ff6100'
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value) => [`${value}%`, 'Uso']}
                      />
                      <Bar dataKey="usage">
                        {gateways.sort((a, b) => b.usage - a.usage).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#00ff90' : index === 1 ? '#ff2389' : '#ff6100'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="mt-8 bg-card-secondary border-border-secondary">
            <CardHeader>
              <CardTitle>Resumo dos Gateways</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">3</div>
                  <p className="text-sm text-muted-foreground">Gateways Ativos</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">1</div>
                  <p className="text-sm text-muted-foreground">Gateways Inativos</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">R$ 500K</div>
                  <p className="text-sm text-muted-foreground">Limite Máximo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add Gateway Modal */}
      <AddGatewayModal
        open={showAddGatewayModal}
        onOpenChange={setShowAddGatewayModal}
        onSuccess={() => {
          setShowAddGatewayModal(false);
        }}
      />
    </div>
  );
};

export default AdminGateways;