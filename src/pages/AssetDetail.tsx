import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LivePriceChart } from '@/components/markets/LivePriceChart';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface FastPool {
  id: string;
  asset_symbol: string;
  asset_name: string;
  question: string;
  category: string;
  opening_price: number;
  closing_price?: number;
  round_start_time: string;
  round_end_time: string;
  base_odds: number;
  status: string;
  paused?: boolean;
}

interface FastPoolResult {
  id: string;
  result: 'subiu' | 'desceu' | 'manteve';
  opening_price: number;
  closing_price: number;
  price_change_percent: number;
  created_at: string;
}

const AssetDetail = () => {
  const { assetSymbol } = useParams<{ assetSymbol: string }>();
  const [currentPool, setCurrentPool] = useState<FastPool | null>(null);
  const [poolHistory, setPoolHistory] = useState<FastPoolResult[]>([]);
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { toast } = useToast();

  useEffect(() => {
    loadPoolData();
    loadPoolHistory();

    // Subscribe to pool updates
    const channel = supabase
      .channel(`asset-${assetSymbol}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fast_pools',
          filter: `asset_symbol=eq.${assetSymbol}`
        },
        () => {
          loadPoolData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fast_pool_results'
        },
        () => {
          loadPoolHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [assetSymbol]);

  const loadPoolData = async () => {
    try {
      const { data, error } = await supabase
        .from('fast_pools')
        .select('*')
        .eq('asset_symbol', assetSymbol)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCurrentPool(data);
    } catch (error) {
      console.error('Error loading pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPoolHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('fast_pool_results')
        .select('*, fast_pools!inner(asset_symbol)')
        .eq('fast_pools.asset_symbol', assetSymbol)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const typedData = (data || []).map((item: any) => ({
        ...item,
        result: item.result as 'subiu' | 'desceu' | 'manteve'
      }));
      
      setPoolHistory(typedData);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  useEffect(() => {
    if (!currentPool) return;

    const calculateCountdown = () => {
      const now = new Date().getTime();
      const endTime = new Date(currentPool.round_end_time).getTime();
      const timeLeft = Math.max(0, (endTime - now) / 1000);
      setCountdown(timeLeft);
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 100);

    return () => clearInterval(timer);
  }, [currentPool]);

  const handleBet = async (side: 'subiu' | 'desceu') => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para opinar",
        variant: "destructive"
      });
      return;
    }

    if (!currentPool || currentPool.paused) {
      toast({
        title: "Pool pausado",
        description: "Este pool está temporariamente indisponível",
        variant: "destructive"
      });
      return;
    }

    // Redirect to Fast page with this asset
    window.location.href = `/fast`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentPool) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ativo não encontrado</h2>
          <Link to="/fast">
            <Button>Voltar para Fast Markets</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/fast" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Fast Markets
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{currentPool.asset_name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{currentPool.asset_symbol}</Badge>
            <Badge>{currentPool.category}</Badge>
            {currentPool.paused && (
              <Badge variant="destructive">Pausado</Badge>
            )}
          </div>
        </div>

        {/* Live Price Chart - Only for crypto category */}
        {currentPool.category === 'cripto' && (
          <div className="mb-6">
            <LivePriceChart 
              assetSymbol={currentPool.asset_symbol} 
              assetName={currentPool.asset_name} 
            />
          </div>
        )}

        {/* Current Pool Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pool Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{currentPool.question}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tempo restante</span>
                </div>
                <span className="text-2xl font-bold">{Math.floor(countdown)}s</span>
              </div>

              {currentPool.opening_price && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Preço de Abertura</span>
                  <span className="font-semibold">${currentPool.opening_price.toLocaleString()}</span>
                </div>
              )}

              {/* Gold Pass Style Reward Card */}
              <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-500/50 shadow-xl mt-4">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent animate-shimmer"></div>
                <div className="relative z-10 text-center">
                  <span className="text-xs font-semibold text-yellow-500/80 tracking-wide">RECOMPENSA POTENCIAL</span>
                  <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent mt-1">
                    {currentPool.base_odds}x suas moedas
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4">
                <Button
                  onClick={() => {
                    handleBet('subiu');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPool.paused || countdown <= 15}
                  className="bg-[#00ff90] hover:bg-[#00ff90]/90 text-black"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  SUBIU
                </Button>
                <Button
                  onClick={() => {
                    handleBet('desceu');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPool.paused || countdown <= 15}
                  className="bg-[#ff2389] hover:bg-[#ff2389]/90 text-white"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  DESCEU
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats & Order Book Aggression */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agressão do Order Book</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Odds Bar - similar to market odds */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-[#00ff90]">SUBIU</span>
                  <span className="text-[#ff2389]">DESCEU</span>
                </div>
                <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-[#00ff90] transition-all duration-500"
                    style={{ width: '50%' }}
                  />
                  <div 
                    className="absolute right-0 top-0 h-full bg-[#ff2389] transition-all duration-500"
                    style={{ width: '50%' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-4 text-sm font-bold">
                    <span className="text-black">50%</span>
                    <span className="text-white">50%</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Odds Base</span>
                <span className="font-semibold">{currentPool.base_odds}x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Round</span>
                <span className="font-semibold">#{currentPool.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={currentPool.status === 'active' ? 'default' : 'secondary'}>
                  {currentPool.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            {poolHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum resultado disponível</p>
            ) : (
              <div className="space-y-2">
                {poolHistory.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={
                        result.result === 'subiu' 
                          ? 'bg-[#00ff90] text-black' 
                          : result.result === 'desceu'
                          ? 'bg-[#ff2389] text-white'
                          : 'bg-muted text-muted-foreground'
                      }>
                        {result.result === 'subiu' ? 'Subiu' : result.result === 'desceu' ? 'Desceu' : 'Manteve'}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">
                          {result.price_change_percent > 0 ? '+' : ''}{result.price_change_percent.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(result.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${result.closing_price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        de ${result.opening_price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetDetail;
