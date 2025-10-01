import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, TrendingUp, Clock, DollarSign, History, Pause, Play, Power, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AssetConfigCard } from '@/components/admin/AssetConfigCard';

interface FastPool {
  id: string;
  asset_symbol: string;
  asset_name: string;
  question: string;
  round_number?: number;
  status?: string;
  category: string;
  opening_price?: number;
  closing_price?: number;
  round_start_time?: string;
  round_end_time?: string;
  api_connected: boolean;
  api_url?: string;
  last_api_sync?: string;
  created_at: string;
  paused?: boolean;
  base_odds?: number;
  api_key?: string;
  webhook_url?: string;
  updated_at?: string;
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
  const [fastEnabled, setFastEnabled] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 10;
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
      checkFastStatus();
      
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

  const checkFastStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('fast_pool_configs')
        .select('paused')
        .limit(1)
        .single();
      
      if (!error && data) {
        setFastEnabled(!data.paused);
      }
    } catch (error) {
      console.error('Error checking FAST status:', error);
    }
  };

  const handleToggleFast = async (enabled: boolean) => {
    try {
      // Update all configs
      const { error: configError } = await supabase
        .from('fast_pool_configs')
        .update({ paused: !enabled })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (configError) throw configError;
      
      // Update all active pools
      const { error: poolsError } = await supabase
        .from('fast_pools')
        .update({ paused: !enabled })
        .eq('status', 'active');
      
      if (poolsError) throw poolsError;
      
      setFastEnabled(enabled);
      
      toast({
        title: enabled ? "FAST ativado" : "FAST desativado",
        description: enabled 
          ? "Os mercados FAST estão agora disponíveis para apostas"
          : "Os mercados FAST foram pausados para atualização",
      });
      
      fetchGeneralPoolConfigs();
    } catch (error) {
      console.error('Error toggling FAST:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar status do FAST",
        variant: "destructive"
      });
    }
  };

  const fetchGeneralPoolConfigs = async () => {
    try {
      // Get all pool configurations
      const { data: configs, error: configsError } = await supabase
        .from('fast_pool_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (configsError) throw configsError;
      
      // Get distinct asset symbols that have been used in pools
      const { data: usedAssets, error: assetsError } = await supabase
        .from('fast_pools')
        .select('asset_symbol')
        .order('created_at', { ascending: false });
      
      if (assetsError) throw assetsError;
      
      // Create a set of used asset symbols
      const usedSymbols = new Set((usedAssets || []).map(a => a.asset_symbol));
      
      // Filter configs to only show assets that have been used in pools
      const filteredConfigs = (configs || []).filter(config => 
        usedSymbols.has(config.asset_symbol)
      );
      
      setPools(filteredConfigs);
    } catch (error) {
      console.error('Error fetching pool configs:', error);
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
      // Update the config in fast_pool_configs
      const { error: configError } = await supabase
        .from('fast_pool_configs')
        .update({ paused: !pool.paused })
        .eq('asset_symbol', pool.asset_symbol);
      
      if (configError) throw configError;
      
      // Also update all active rounds in fast_pools
      const { error: poolsError } = await supabase
        .from('fast_pools')
        .update({ paused: !pool.paused })
        .eq('asset_symbol', pool.asset_symbol)
        .eq('status', 'active');
      
      if (poolsError) throw poolsError;
      
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 bg-card/50 px-6 py-3 rounded-lg border border-border">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="#ff2389" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#ff2389"/>
                </svg>
                <Label htmlFor="fast-toggle" className="cursor-pointer font-bold text-lg">
                  Fast
                </Label>
                <div className="flex items-center gap-2">
                  <Power className={`w-5 h-5 transition-colors ${fastEnabled ? 'text-[#00ff90]' : 'text-muted-foreground'}`} />
                  <Switch
                    id="fast-toggle"
                    checked={fastEnabled}
                    onCheckedChange={handleToggleFast}
                    style={{
                      backgroundColor: fastEnabled ? '#ff2389' : undefined
                    }}
                    className="scale-125 data-[state=unchecked]:bg-muted"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => navigate('/admin/fast/api-config')} variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  APIs
                </Button>
                <Button onClick={() => navigate('/admin/fast/algorithm')} variant="outline" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Algoritmo
                </Button>
              </div>
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
                <CardTitle className="text-sm font-medium">Total de Opiniões</CardTitle>
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

          {/* Asset Configurations */}
          <Card className="bg-card-secondary border-border-secondary mb-8">
            <CardHeader>
              <CardTitle>Configurações de Ativos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure os ativos que serão usados como modelo para criar os próximos pools
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pools.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum ativo configurado
                </div>
              ) : (
                pools
                  .sort((a, b) => {
                    // Paused assets go to the top
                    if (a.paused && !b.paused) return -1;
                    if (!a.paused && b.paused) return 1;
                    return 0;
                  })
                  .map(asset => (
                  <AssetConfigCard 
                    key={asset.id} 
                    asset={asset} 
                    onUpdate={fetchGeneralPoolConfigs}
                    onTogglePause={handleTogglePause}
                    getCategoryColor={getCategoryColor}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Pool History */}
          <Card className="bg-card-secondary border-border-secondary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    <CardTitle>Histórico de Pools</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pools finalizados com resultados
                  </p>
                </div>
                {poolHistory.length > historyPerPage && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                      disabled={historyPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {historyPage} de {Math.ceil(poolHistory.length / historyPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage(prev => Math.min(Math.ceil(poolHistory.length / historyPerPage), prev + 1))}
                      disabled={historyPage >= Math.ceil(poolHistory.length / historyPerPage)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {poolHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum resultado disponível
                </div>
              ) : (
                <div className="space-y-3">
                  {poolHistory
                    .slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage)
                    .map((result) => (
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
