import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, TrendingUp, Clock, DollarSign, History, Pause, Play } from 'lucide-react';
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
  paused?: boolean;
}

interface PoolResult {
  id: string;
  pool_id: string;
  result: 'subiu' | 'desceu' | 'manteve';
  opening_price: number;
  closing_price: number;
  created_at: string;
  fast_pools: {
    asset_name: string;
    asset_symbol: string;
    round_start_time: string;
    round_end_time: string;
  };
}

const AdminFast = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pools, setPools] = useState<FastPool[]>([]);
  const [poolHistory, setPoolHistory] = useState<PoolResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_pools: 0,
    active_pools: 0,
    total_bets: 0,
    total_volume: 0
  });

  useEffect(() => {
    if (user) {
      fetchGeneralPoolConfigs();
      fetchPoolHistory();
      fetchStats();
      
      // Realtime subscription for pool results - always update history
      const channel = supabase
        .channel('admin-pool-results')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'fast_pool_results'
          },
          () => {
            fetchPoolHistory();
            fetchStats();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchGeneralPoolConfigs = async () => {
    try {
      // Get one pool per category for general configuration display
      const { data, error } = await supabase
        .from('fast_pools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Group by category and asset_symbol, get only unique configurations
      const uniqueConfigs = new Map();
      data?.forEach((pool: any) => {
        const key = `${pool.category}-${pool.asset_symbol}`;
        if (!uniqueConfigs.has(key)) {
          uniqueConfigs.set(key, pool);
        }
      });
      
      setPools(Array.from(uniqueConfigs.values()));
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPoolHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('fast_pool_results')
        .select('*, fast_pools!inner(asset_name, asset_symbol, round_start_time, round_end_time)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const typedData = (data || []).map((item: any) => ({
        ...item,
        result: item.result as 'subiu' | 'desceu' | 'manteve'
      }));
      
      setPoolHistory(typedData);
    } catch (error) {
      console.error('Error fetching pool history:', error);
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

  const handleTogglePause = async (pool: FastPool) => {
    try {
      const { error } = await supabase
        .from('fast_pools')
        .update({ paused: !pool.paused })
        .eq('asset_symbol', pool.asset_symbol)
        .eq('category', pool.category);
      
      if (error) throw error;
      
      toast({
        title: pool.paused ? "Pool retomado" : "Pool pausado",
        description: `${pool.asset_name} foi ${pool.paused ? 'retomado' : 'pausado'}`,
      });
      
      fetchGeneralPoolConfigs();
    } catch (error) {
      console.error('Error toggling pause:', error);
      toast({
        title: "Erro",
        description: "Falha ao pausar/retomar pool",
        variant: "destructive"
      });
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

  const getResultColor = (result: string) => {
    switch (result) {
      case 'subiu':
        return 'bg-gray-700 text-white';
      case 'desceu':
        return 'bg-[#ff2389] text-white';
      case 'manteve':
        return 'bg-[#FFD800] text-gray-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
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
                Gerenciar pools rápidos e configurações gerais
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

          {/* General Pool Configurations */}
          <Card className="bg-card-secondary border-border-secondary mb-8">
            <CardHeader>
              <CardTitle>Configurações Gerais dos Pools</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configurações aplicadas a todos os próximos rounds de cada pool
              </p>
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
                pools
                  .sort((a, b) => {
                    // Paused pools go to the top
                    if (a.paused && !b.paused) return -1;
                    if (!a.paused && b.paused) return 1;
                    return 0;
                  })
                  .map(pool => (
                  <div key={`${pool.category}-${pool.asset_symbol}`} className="p-4 rounded-lg border border-border bg-card/50 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold">{pool.asset_name}</h3>
                          <Badge className={getCategoryColor(pool.category)}>
                            {pool.category}
                          </Badge>
                          {pool.api_connected && (
                            <Badge className="bg-success/10 text-success">
                              API Conectada
                            </Badge>
                          )}
                          {pool.paused && (
                            <Badge className="bg-yellow-500/10 text-yellow-600">
                              Pausado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">Configuração Geral de API</p>
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
                        variant={pool.paused ? "default" : "outline"}
                        size="sm" 
                        className={`gap-2 ${!pool.paused ? 'bg-[#ff2389] hover:bg-[#ff2389]/90 text-white border-[#ff2389]' : 'bg-success hover:bg-success/90 text-white'}`}
                        onClick={() => handleTogglePause(pool)}
                      >
                        {pool.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        {pool.paused ? 'Retomar' : 'Pausar'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Pool History */}
          <Card className="bg-card-secondary border-border-secondary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" />
                <CardTitle>Histórico de Pools</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Últimos 20 pools finalizados com resultados
              </p>
            </CardHeader>
            <CardContent>
              {poolHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum resultado disponível
                </div>
              ) : (
                <div className="space-y-3">
                  {poolHistory.map((result) => (
                    <div 
                      key={result.id} 
                      className="p-4 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{result.fast_pools.asset_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {result.fast_pools.asset_symbol}
                          </Badge>
                        </div>
                        <Badge className={getResultColor(result.result)}>
                          {result.result === 'subiu' ? 'Subiu!' : result.result === 'desceu' ? 'Desceu!' : 'Manteve!'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Início</p>
                          <p className="font-medium">
                            {new Date(result.fast_pools.round_start_time).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Fim</p>
                          <p className="font-medium">
                            {new Date(result.fast_pools.round_end_time).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Preço Inicial</p>
                          <p className="font-medium">${result.opening_price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Preço Final</p>
                          <p className="font-medium">${result.closing_price.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminFast;
