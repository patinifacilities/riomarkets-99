import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Percent, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';

interface RevenueData {
  cancellationFees: number;
  poolFees: number;
  conversionFees: number;
  totalRevenue: number;
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
  const [loading, setLoading] = useState(true);

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

      // Buscar taxas de conversão
      const { data: conversionData } = await supabase
        .from('wallet_transactions')
        .select('valor')
        .ilike('descricao', '%conversão%');

      // Calcular taxas de pool (estimativa baseada nos mercados liquidados)
      const { data: marketsData } = await supabase
        .from('markets')
        .select('id')
        .eq('status', 'liquidado');

      const cancellationFees = cancellationData?.reduce((sum, t) => sum + Math.abs(t.valor), 0) || 0;
      const conversionFees = conversionData?.reduce((sum, t) => sum + Math.abs(t.valor), 0) || 0;
      const poolFees = (marketsData?.length || 0) * 100; // Estimativa

      setRevenueData({
        cancellationFees,
        poolFees,
        conversionFees,
        totalRevenue: cancellationFees + poolFees + conversionFees
      });
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
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
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

        {/* Revenue Breakdown */}
        <Card>
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
  );
};

export default AdminRevenue;