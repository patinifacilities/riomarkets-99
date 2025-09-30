import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface FastPool {
  id: string;
  asset_symbol: string;
  asset_name: string;
  question: string;
  round_number: number;
  status: string;
  category: string;
  opening_price: number;
  closing_price: number;
  round_start_time: string;
  round_end_time: string;
  api_connected: boolean;
  api_url?: string;
  last_api_sync?: string;
  created_at: string;
}

const AdminFast = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pools, setPools] = useState<FastPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_pools: 0,
    active_pools: 0,
    total_bets: 0,
    total_volume: 0
  });

  useEffect(() => {
    if (user) {
      fetchPools();
      fetchStats();
    }
  }, [user]);

  const fetchPools = async () => {
    try {
      const { data, error } = await supabase
        .from('fast_pools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPools(data || []);
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get pool counts
      const { data: poolsData } = await supabase
        .from('fast_pools')
        .select('status');

      const totalPools = poolsData?.length || 0;
      const activePools = poolsData?.filter(p => p.status === 'active').length || 0;

      // Get bet stats
      const { data: betsData } = await supabase
        .from('fast_pool_bets')
        .select('amount_rioz');

      const totalBets = betsData?.length || 0;
      const totalVolume = betsData?.reduce((sum, bet) => sum + Number(bet.amount_rioz), 0) || 0;

      setStats({
        total_pools: totalPools,
        active_pools: activePools,
        total_bets: totalBets,
        total_volume: totalVolume
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-muted text-success';
      case 'completed':
        return 'bg-accent-muted text-accent';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      commodities: 'bg-yellow-500/10 text-yellow-500',
      crypto: 'bg-purple-500/10 text-purple-500',
      forex: 'bg-blue-500/10 text-blue-500',
      stocks: 'bg-green-500/10 text-green-500'
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0 min-w-0">
        <div className="max-w-full mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
              <h1 className="text-3xl font-bold mb-2">Fast Pools</h1>
              <p className="text-muted-foreground">
                Gerenciar pools rápidos e configurações de API
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pools</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_pools}</div>
              </CardContent>
            </Card>

            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pools Ativos</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{stats.active_pools}</div>
              </CardContent>
            </Card>

            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Apostas</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_bets}</div>
              </CardContent>
            </Card>

            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_volume.toFixed(2)} RIOZ</div>
              </CardContent>
            </Card>
          </div>

          {/* Pools List */}
          <Card className="bg-card-secondary border-border-secondary">
            <CardHeader>
              <CardTitle>Pools Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pools.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pool encontrado
                </div>
              ) : (
                pools.map(pool => (
                  <div key={pool.id} className="p-4 rounded-lg border border-border bg-card/50 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold">{pool.asset_name}</h3>
                          <Badge className={getStatusColor(pool.status)}>
                            {pool.status}
                          </Badge>
                          <Badge className={getCategoryColor(pool.category)}>
                            {pool.category}
                          </Badge>
                          {pool.api_connected && (
                            <Badge className="bg-success/10 text-success">
                              API Conectada
                            </Badge>
                          )}
                          {(pool as any).paused && (
                            <Badge className="bg-yellow-500/10 text-yellow-600">
                              Pausado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">Configuração de API (Geral)</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {pool.api_connected 
                            ? `API: ${pool.api_url?.substring(0, 50)}...` 
                            : 'Usando API padrão de mercado'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span>Símbolo: {pool.asset_symbol}</span>
                          <span>Categoria: {pool.category}</span>
                          {pool.last_api_sync && (
                            <span>Última Sync: {new Date(pool.last_api_sync).toLocaleString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => navigate(`/admin/fast/${pool.id}/config`)}
                      >
                        <Settings className="w-4 h-4" />
                        Configurar API
                      </Button>
                      
                      <Button 
                        variant={(pool as any).paused ? "default" : "outline"}
                        size="sm" 
                        className="gap-2"
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('fast_pools')
                              .update({ paused: !(pool as any).paused })
                              .eq('asset_symbol', pool.asset_symbol)
                              .eq('category', pool.category);
                            
                            if (error) throw error;
                            
                            toast({
                              title: (pool as any).paused ? "Pool retomado" : "Pool pausado",
                              description: `${pool.asset_name} foi ${(pool as any).paused ? 'retomado' : 'pausado'}`,
                            });
                            
                            fetchPools();
                          } catch (error) {
                            console.error('Error toggling pause:', error);
                            toast({
                              title: "Erro",
                              description: "Falha ao pausar/retomar pool",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        {(pool as any).paused ? 'Retomar' : 'Pausar'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminFast;
