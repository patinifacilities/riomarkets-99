import { ArrowLeft, QrCode, Bitcoin, Shield, Settings, TrendingUp } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useState } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const AdminGatewaysSaque = () => {
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

  const withdrawalGateways = [
    {
      id: 'pix-withdrawal',
      name: 'PIX Saque',
      status: true,
      description: 'Sistema de saques instantâneos via PIX',
      icon: <QrCode className="w-5 h-5" />,
      fees: '0%',
      limits: 'R$ 10,00 - R$ 50.000,00',
      processTime: 'Instantâneo',
      volume: 75
    },
    {
      id: 'crypto-withdrawal',
      name: 'Crypto Saque',
      status: true,
      description: 'Saques para carteiras de criptomoedas',
      icon: <Bitcoin className="w-5 h-5" />,
      fees: '1.5%',
      limits: 'R$ 50,00 - R$ 500.000,00',
      processTime: '5-15 min',
      volume: 25
    }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/admin/gateways" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
              <h1 className="text-3xl font-bold mb-2">Gateways de Saque</h1>
              <p className="text-muted-foreground">
                Configurar e gerenciar métodos de saque da plataforma
              </p>
            </div>
            <Badge variant="destructive" className="text-xs">
              ADMIN
            </Badge>
          </div>

          <div className="grid gap-6">
            {withdrawalGateways.map((gateway) => (
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <h4 className="font-medium mb-1">Taxas</h4>
                      <p className="text-sm text-muted-foreground">{gateway.fees}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Limites</h4>
                      <p className="text-sm text-muted-foreground">{gateway.limits}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Tempo</h4>
                      <p className="text-sm text-muted-foreground">{gateway.processTime}</p>
                    </div>
                    <div className="flex justify-end">
                       <Link to={`/admin/gateway-config-${gateway.id}`}>
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

          {/* Volume Chart */}
          <div className="mt-8">
            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Volume de Saques por Gateway (7 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  pix: { label: "PIX", color: "hsl(var(--chart-1))" },
                  crypto: { label: "Crypto", color: "hsl(var(--chart-2))" }
                }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { day: 'Seg', pix: 75, crypto: 25 },
                      { day: 'Ter', pix: 78, crypto: 22 },
                      { day: 'Qua', pix: 72, crypto: 28 },
                      { day: 'Qui', pix: 80, crypto: 20 },
                      { day: 'Sex', pix: 77, crypto: 23 },
                      { day: 'Sab', pix: 85, crypto: 15 },
                      { day: 'Dom', pix: 82, crypto: 18 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="pix" stroke="#00ff90" strokeWidth={2} />
                      <Line type="monotone" dataKey="crypto" stroke="#ff6100" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="mt-8 bg-card-secondary border-border-secondary">
            <CardHeader>
              <CardTitle>Resumo dos Gateways de Saque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">2</div>
                  <p className="text-sm text-muted-foreground">Gateways Ativos</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">0</div>
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
    </div>
  );
};

export default AdminGatewaysSaque;