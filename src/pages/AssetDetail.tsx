import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Zap, ArrowUp, ArrowDown, LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LivePriceChart } from '@/components/markets/LivePriceChart';

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
  round_number: number;
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
  const navigate = useNavigate();
  const [currentPool, setCurrentPool] = useState<FastPool | null>(null);
  const [poolHistory, setPoolHistory] = useState<FastPoolResult[]>([]);
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState(100);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadPoolData();
    loadPoolHistory();

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
          loadPoolHistory();
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fast_pool_configs'
        },
        () => {
          loadPoolData();
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
    const timer = setInterval(calculateCountdown, 16);

    return () => clearInterval(timer);
  }, [currentPool]);
  
  // Trigger reload when countdown reaches 0 - only once per pool
  useEffect(() => {
    // Only trigger if countdown just reached 0 (not already at 0)
    if (countdown > 0 || !currentPool) return;
    
    console.log('⏰ Countdown reached 0, scheduling pool reload...');
    
    // Wait for pool to finalize and next pool to be created (5 seconds to account for the 1s delay in finalization)
    const reloadTimer = setTimeout(() => {
      console.log('🔄 Loading next pool...');
      loadPoolData();
      loadPoolHistory();
    }, 5000);
    
    return () => clearTimeout(reloadTimer);
  }, [currentPool?.id]); // Only trigger when pool ID changes (new pool created)

  const getOdds = () => {
    const timeElapsed = 60 - countdown;
    
    if (timeElapsed <= 28) {
      const progress = timeElapsed / 28;
      return Math.max(1.20, 1.80 - (progress * 0.60));
    } else if (timeElapsed <= 50) {
      const progress = (timeElapsed - 28) / 22;
      return Math.max(1.10, 1.20 - (progress * 0.10));
    } else {
      return 1.10;
    }
  };

  const handleBet = async (side: 'subiu' | 'desceu') => {
    if (!user) {
      navigate('/auth');
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

    navigate('/fast');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentPool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/fast" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Fast Markets
        </Link>

        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff2389]/10 to-[#ff2389]/5 px-6 py-3 rounded-full border border-[#ff2389]/20 mb-4">
            <Zap className="w-5 h-5 text-[#ff2389] animate-pulse" />
            <span className="text-[#ff2389] font-semibold tracking-wide">FAST MARKET</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{currentPool.asset_name}</h1>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline">{currentPool.asset_symbol}</Badge>
            <Badge>{currentPool.category}</Badge>
            {currentPool.paused && (
              <Badge variant="destructive">Pausado</Badge>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[#ff2389]/5"></div>
            
            {currentPool.paused && (
              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                <div className="text-center px-4">
                  <div className="text-5xl mb-3">🚧</div>
                  <p className="text-white font-bold text-lg mb-1">Em Atualização</p>
                  <p className="text-white/70 text-sm">Pool temporariamente indisponível</p>
                </div>
              </div>
            )}
            
            <CardHeader className="relative z-10 text-center pb-3">
              <div className="flex items-center justify-center mb-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                  Pool #{currentPool.round_number}
                </Badge>
              </div>
              
              <CardTitle className="text-2xl mb-2">
                {currentPool.asset_name}
              </CardTitle>
              
              <p className="text-sm text-muted-foreground mb-2">{currentPool.question}</p>
              
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="bg-muted/50 px-2 py-1 rounded">{currentPool.asset_symbol}</span>
                <span>•</span>
                <span>${currentPool.opening_price.toLocaleString()}</span>
              </div>
            </CardHeader>

            <CardContent className="relative z-10 space-y-4">
              {/* Bet Amount Slider */}
              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center justify-between">
                  <span>Opinar</span>
                  <span className="text-base text-primary font-bold">{betAmount} RZ</span>
                </label>
                <div className="relative px-4 py-4 bg-gradient-to-br from-muted/40 via-muted/30 to-muted/20 rounded-2xl border-2 border-border/60 shadow-inner">
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    step="1"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer slider relative z-10"
                    style={{
                      background: `linear-gradient(to right, #00ff90 0%, #00ff90 ${((betAmount - 1) / 999) * 100}%, rgba(255,255,255,0.1) ${((betAmount - 1) / 999) * 100}%, rgba(255,255,255,0.1) 100%)`
                    }}
                  />
                  <style>{`
                    input[type="range"].slider::-webkit-slider-thumb {
                      appearance: none;
                      width: 28px;
                      height: 28px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, #00ff90 0%, #00dd80 50%, #00cc70 100%);
                      cursor: grab;
                      border: 4px solid white;
                      box-shadow: 0 3px 12px rgba(0, 255, 144, 0.5), 0 0 0 2px rgba(0, 255, 144, 0.2), inset 0 1px 3px rgba(255,255,255,0.3);
                      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    input[type="range"].slider::-webkit-slider-thumb:hover {
                      transform: scale(1.15);
                      box-shadow: 0 5px 16px rgba(0, 255, 144, 0.7), 0 0 0 3px rgba(0, 255, 144, 0.3), inset 0 1px 3px rgba(255,255,255,0.4);
                    }
                    input[type="range"].slider::-webkit-slider-thumb:active {
                      cursor: grabbing;
                      transform: scale(1.05);
                      box-shadow: 0 2px 8px rgba(0, 255, 144, 0.6), 0 0 0 2px rgba(0, 255, 144, 0.25);
                    }
                    input[type="range"].slider::-moz-range-thumb {
                      width: 28px;
                      height: 28px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, #00ff90 0%, #00dd80 50%, #00cc70 100%);
                      cursor: grab;
                      border: 4px solid white;
                      box-shadow: 0 3px 12px rgba(0, 255, 144, 0.5), 0 0 0 2px rgba(0, 255, 144, 0.2);
                      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    input[type="range"].slider::-moz-range-thumb:hover {
                      transform: scale(1.15);
                      box-shadow: 0 5px 16px rgba(0, 255, 144, 0.7), 0 0 0 3px rgba(0, 255, 144, 0.3);
                    }
                    input[type="range"].slider::-moz-range-thumb:active {
                      cursor: grabbing;
                      transform: scale(1.05);
                    }
                  `}</style>
                  <div className="flex justify-between text-[10px] font-semibold text-muted-foreground/70 mt-2.5 px-1">
                    <span>1 RZ</span>
                    <span>1.000 RZ</span>
                  </div>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 text-[#ff2389]`}
                  style={countdown <= 23 && countdown > 0 ? {
                    animation: `pulse ${Math.max(0.2, (countdown - 23) / 37 * 2)}s cubic-bezier(0.4, 0, 0.6, 1) infinite`
                  } : undefined}
                >
                  {countdown > 0 ? `${countdown.toFixed(2)}s` : 'Aguarde...'}
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#ff2389] to-[#ff2389]/80"
                    style={{ 
                      width: `${(countdown / 60) * 100}%`,
                      transition: 'width 16ms linear',
                      animation: countdown <= 23 && countdown > 0 ? `pulse ${Math.max(0.2, (countdown - 23) / 37 * 2)}s cubic-bezier(0.4, 0, 0.6, 1) infinite` : undefined
                    }}
                  />
                </div>
              </div>

              {/* Opinion Buttons */}
              {!user ? (
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Fazer Login para Opinar
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleBet('subiu')}
                    disabled={countdown <= 15}
                    className="h-12 text-sm font-semibold bg-[#00ff90] hover:bg-[#00ff90]/90 text-black"
                  >
                    <div className="flex items-center justify-between w-full px-1">
                      <ArrowUp className="w-4 h-4" />
                      <span>Subir</span>
                      <span className="text-xs opacity-80">
                        x{getOdds().toFixed(2)}
                      </span>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => handleBet('desceu')}
                    disabled={countdown <= 15}
                    className="h-12 text-sm font-semibold bg-[#ff2389] hover:bg-[#ff2389]/90 text-white"
                  >
                    <div className="flex items-center justify-between w-full px-1">
                      <ArrowDown className="w-4 h-4" />
                      <span>Descer</span>
                      <span className="text-xs opacity-80">
                        x{getOdds().toFixed(2)}
                      </span>
                    </div>
                  </Button>
                </div>
              )}

              {countdown <= 15 && countdown > 0 && (
                <div className="text-center text-xs text-muted-foreground">
                  Opiniões bloqueadas
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Price Chart */}
        <div className="max-w-4xl mx-auto mt-8">
          <LivePriceChart 
            assetSymbol={currentPool.asset_symbol} 
            assetName={currentPool.asset_name}
            poolStartPrice={currentPool.opening_price}
          />
        </div>

        {/* History */}
        <div className="max-w-4xl mx-auto mt-8">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Últimos Resultados - {currentPool.asset_symbol}</CardTitle>
            </CardHeader>
            <CardContent>
              {poolHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum resultado disponível</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {poolHistory.map((result, index) => (
                    <div
                      key={result.id}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg border transition-all duration-300",
                        result.result === 'subiu' 
                          ? 'bg-[#00ff90]/10 border-[#00ff90]/30' 
                          : result.result === 'desceu'
                          ? 'bg-[#ff2389]/10 border-[#ff2389]/30'
                          : 'bg-muted/20 border-border'
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center mb-2",
                        result.result === 'subiu' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : result.result === 'desceu'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-gray-100 dark:bg-gray-900/30'
                      )}>
                        {result.result === 'subiu' ? (
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : result.result === 'desceu' ? (
                          <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">=</span>
                        )}
                      </div>
                      <span className="text-xs font-medium">
                        {result.price_change_percent > 0 ? '+' : ''}{result.price_change_percent.toFixed(2)}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ${result.closing_price.toLocaleString()}
                      </span>
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

export default AssetDetail;
