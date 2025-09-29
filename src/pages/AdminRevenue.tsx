import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Percent, RefreshCw, ArrowLeft, PieChart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, Link } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface RevenueData {
  cancellationFees: number;
  poolFees: number;
  conversionFees: number;
  totalRevenue: number;
}

interface PaymentMethodData {
  method: string;
  value: number;
  percentage: number;
  fill: string;
  [key: string]: any;
}

const AdminRevenue = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const [revenueData, setRevenueData] = useState<RevenueData>({
    cancellationFees: 0,
    poolFees: 0,
    conversionFees: 0,
    totalRevenue: 0
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.id && profile?.is_admin) {
      fetchRevenueData();
    }
  }, [user?.id, profile?.is_admin]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      // Buscar taxas de cancelamento
      const { data: cancellationData } = await supabase
        .from('wallet_transactions')
        .select('valor')
        .ilike('descricao', '%cancelamento%');

      // Buscar taxas de conversão (receitas da plataforma)
      const { data: conversionData } = await supabase
        .from('wallet_transactions')
        .select('valor')
        .ilike('descricao', '%Receita - Taxa de conversão%');

      // Calcular taxas de pool (estimativa baseada nos mercados liquidados)
      const { data: marketsData } = await supabase
        .from('markets')
        .select('id')
        .eq('status', 'liquidado');

      const cancellationFees = cancellationData?.reduce((sum, t) => sum + Math.abs(t.valor), 0) || 0;
      const conversionFees = conversionData?.reduce((sum, t) => sum + t.valor, 0) || 0;
      const poolFees = (marketsData?.length || 0) * 100;

      setRevenueData({
        cancellationFees,
        poolFees,
        conversionFees,
        totalRevenue: cancellationFees + poolFees + conversionFees
      });

      // Mock data for payment methods (PIX, Credit Card, etc.) with specific colors
      setPaymentMethods([
        { method: 'PIX', value: 125000, percentage: 65, fill: '#00ff90' },
        { method: 'Cartão de Crédito', value: 48000, percentage: 25, fill: '#ff2389' },
        { method: 'Boleto', value: 19200, percentage: 10, fill: '#ff6100' }
      ]);

      // Mock monthly revenue data with specific colors based on fee values
      setMonthlyRevenue([
        { month: 'Jan', revenue: 45000, fees: 2000, feeColor: 'white' },
        { month: 'Fev', revenue: 52000, fees: 2300, feeColor: '#ff2389' },
        { month: 'Mar', revenue: 48000, fees: 2100, feeColor: 'white' },
        { month: 'Abr', revenue: 61000, fees: 2800, feeColor: '#ff2389' },
        { month: 'Mai', revenue: 55000, fees: 2500, feeColor: '#ff2389' },
        { month: 'Jun', revenue: 67000, fees: 3100, feeColor: '#00ff90' }
      ]);

    } catch (error) {
      console.error('Erro ao buscar dados de receita:', error);
    } finally {
      setLoading(false);
    }
  };

  // Security check
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is admin
  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

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
            <h1 className="text-3xl font-bold mb-2">Receita da Plataforma</h1>
            <p className="text-muted-foreground">
              Acompanhe as taxas coletadas pela plataforma
            </p>
          </div>
          <Badge variant="destructive" className="text-xs">
            ADMIN
          </Badge>
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Percent className="w-5 h-5 text-destructive" />
                </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Taxas de Cancelamento</p>
                   <p className="text-2xl font-bold">R$ {(revenueData.cancellationFees / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Taxas de Pool</p>
                   <p className="text-2xl font-bold">R$ {(revenueData.poolFees / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <RefreshCw className="w-5 h-5 text-accent" />
                </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Taxas de Conversão</p>
                   <p className="text-2xl font-bold">R$ {(revenueData.conversionFees / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Receita Total</p>
                   <p className="text-2xl font-bold text-success">R$ {(revenueData.totalRevenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Methods Distribution */}
          <Card className="bg-card-secondary border-border-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Métodos de Pagamento - Depósitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                pix: { label: "PIX", color: "hsl(var(--chart-1))" },
                credit: { label: "Cartão", color: "hsl(var(--chart-2))" },
                boleto: { label: "Boleto", color: "hsl(var(--chart-3))" }
              }}>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ percentage }) => `${percentage}%`}
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: any) => [`R$ ${(value / 100).toLocaleString('pt-BR')}`, 'Valor']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card className="bg-card-secondary border-border-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Receita Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                revenue: { label: "Receita", color: "hsl(var(--chart-1))" },
                fees: { label: "Taxas", color: "hsl(var(--chart-2))" }
              }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 100).toLocaleString('pt-BR')}`} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: any) => [`R$ ${(value / 100).toLocaleString('pt-BR')}`, '']}
                    />
                     <Bar 
                       dataKey="revenue" 
                       fill="hsl(var(--chart-1))" 
                       name="Receita" 
                     />
                     <Bar 
                       dataKey="fees" 
                       name="Taxas"
                       fill="hsl(var(--chart-2))"
                     />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <Card className="bg-card-secondary border-border-secondary">
          <CardHeader>
            <CardTitle>Detalhamento da Receita</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-card/50">
                    <h3 className="font-semibold mb-2 text-destructive">Taxas de Cancelamento (30%)</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Taxa cobrada quando usuários cancelam suas opiniões
                    </p>
                     <p className="text-xl font-bold">R$ {(revenueData.cancellationFees / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                     <p className="text-sm text-muted-foreground">
                       {((revenueData.cancellationFees / revenueData.totalRevenue) * 100 || 0).toFixed(1)}% do total
                     </p>
                  </div>

                  <div className="p-4 rounded-lg border border-border bg-card/50">
                    <h3 className="font-semibold mb-2 text-primary">Taxas de Pool (20%)</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Taxa cobrada sobre o menor pool ao final de cada mercado
                    </p>
                     <p className="text-xl font-bold">R$ {(revenueData.poolFees / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                     <p className="text-sm text-muted-foreground">
                       {((revenueData.poolFees / revenueData.totalRevenue) * 100 || 0).toFixed(1)}% do total
                     </p>
                  </div>

                  <div className="p-4 rounded-lg border border-border bg-card/50">
                    <h3 className="font-semibold mb-2 text-accent">Taxas de Conversão (1%)</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Taxa cobrada em todas as conversões RIOZ ⇄ BRL
                    </p>
                     <p className="text-xl font-bold">R$ {(revenueData.conversionFees / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                     <p className="text-sm text-muted-foreground">
                       {((revenueData.conversionFees / revenueData.totalRevenue) * 100 || 0).toFixed(1)}% do total
                     </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Acumulado:</span>
                     <span className="text-2xl font-bold text-success">
                       R$ {(revenueData.totalRevenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;