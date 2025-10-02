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
import { PoolResultModal } from '@/components/fast/PoolResultModal';

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
  asset_symbol: string;
  pool_id?: string;
  fast_pools?: {
    round_start_time: string;
    round_end_time: string;
    asset_name: string;
  };
}

const AssetDetail = () => {
  const { assetSymbol } = useParams<{ assetSymbol: string }>();
  const navigate = useNavigate();
  const [currentPool, setCurrentPool] = useState<FastPool | null>(null);
  const [poolHistory, setPoolHistory] = useState<FastPoolResult[]>([]);
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState(() => {
    const saved = localStorage.getItem('assetDetailBetAmount');
    return saved ? parseInt(saved) : 100;
  });
  const [selectedResult, setSelectedResult] = useState<FastPoolResult | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [opinionNotifications, setOpinionNotifications] = useState<{id: string, text: string, side?: 'subiu' | 'desceu', timestamp: number}[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('assetDetailBetAmount', betAmount.toString());
  }, [betAmount]);

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
        (payload) => {
          console.log('🔄 Pool update detected:', payload);
          // Reload immediately when pool is updated (including opening_price adjustments)
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
        .select('*, fast_pools!inner(asset_symbol, round_start_time, round_end_time, asset_name)')
        .eq('fast_pools.asset_symbol', assetSymbol)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Remove duplicates by ID
      const uniqueResults = new Map();
      (data || []).forEach((item: any) => {
        if (!uniqueResults.has(item.id)) {
          uniqueResults.set(item.id, {
            ...item,
            result: item.result as 'subiu' | 'desceu' | 'manteve',
            asset_symbol: assetSymbol,
            fast_pools: {
              round_start_time: item.fast_pools.round_start_time,
              round_end_time: item.fast_pools.round_end_time,
              asset_name: item.fast_pools.asset_name
            }
          });
        }
      });
      
      setPoolHistory(Array.from(uniqueResults.values()));
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  // Dynamic opening_price adjustment in first 3 seconds
  useEffect(() => {
    if (!currentPool) return;

    const startTime = new Date(currentPool.round_start_time).getTime();
    const now = Date.now();
    const elapsedSinceStart = (now - startTime) / 1000; // seconds

    // Only adjust in first 3 seconds
    if (elapsedSinceStart < 3 && elapsedSinceStart >= 0) {
      const adjustTimer = setInterval(async () => {
        try {
          await supabase.functions.invoke('manage-fast-pools', {
            body: {
              action: 'adjust_opening_price',
              poolId: currentPool.id
            }
          });
          loadPoolData(); // Reload to get updated opening_price
        } catch (error) {
          console.error('Error adjusting opening price:', error);
        }
      }, 500); // Adjust every 500ms during first 3 seconds

      // Clear after 3 seconds
      setTimeout(() => clearInterval(adjustTimer), 3000 - (elapsedSinceStart * 1000));

      return () => clearInterval(adjustTimer);
    }
  }, [currentPool?.id]);

  useEffect(() => {
    if (!currentPool) return;

    const calculateCountdown = () => {
      const now = new Date().getTime();
      const endTime = new Date(currentPool.round_end_time).getTime();
      const timeLeft = Math.max(0, (endTime - now) / 1000);
      setCountdown(timeLeft);
      
      // When countdown reaches 0, trigger pool reload
      if (timeLeft === 0) {
        console.log('⏰ Pool ended, reloading...');
        setTimeout(() => {
          loadPoolData();
          loadPoolHistory();
        }, 500); // Reduced to 500ms for faster pool creation
      }
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 100); // Check every 100ms for smoother updates

    return () => clearInterval(timer);
  }, [currentPool?.id]); // Only re-run when pool ID changes

  // Load algorithm config for dynamic odds calculation
  const [algorithmConfig, setAlgorithmConfig] = useState({
    pool_duration_seconds: 60,
    lockout_time_seconds: 2,
    odds_start: 1.80,
    odds_end: 1.10,
    algorithm_type: 'dynamic',
    algo2_odds_high: 1.90,
    algo2_odds_low: 1.10
  });

  const [currentPrice, setCurrentPrice] = useState<number>(0);

  useEffect(() => {
    const loadAlgorithmConfig = async () => {
      try {
        const { data } = await supabase
          .from('fast_pool_algorithm_config')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) {
          setAlgorithmConfig({
            pool_duration_seconds: data.pool_duration_seconds,
            lockout_time_seconds: data.lockout_time_seconds,
            odds_start: Number(data.odds_start),
            odds_end: Number(data.odds_end),
            algorithm_type: data.algorithm_type || 'dynamic',
            algo2_odds_high: Number(data.algo2_odds_high || 1.90),
            algo2_odds_low: Number(data.algo2_odds_low || 1.10)
          });
        }
      } catch (error) {
        console.error('Error loading algorithm config:', error);
      }
    };
    
    loadAlgorithmConfig();

    // Subscribe to algorithm config changes for real-time updates
    const channel = supabase
      .channel('algorithm-config-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fast_pool_algorithm_config'
        },
        () => {
          console.log('🔄 Algorithm config changed, reloading...');
          loadAlgorithmConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getOdds = (side?: 'subiu' | 'desceu') => {
    // Algorithm 2: Price-based
    if (algorithmConfig.algorithm_type === 'price_based' && currentPool && currentPrice > 0) {
      const openingPrice = currentPool.opening_price || 0;
      
      if (openingPrice === 0) {
        return algorithmConfig.algo2_odds_high;
      }

      const priceDiff = currentPrice - openingPrice;
      
      // Base odds assignment
      let baseOddsUp = algorithmConfig.algo2_odds_low;
      let baseOddsDown = algorithmConfig.algo2_odds_high;
      
      if (openingPrice < currentPrice) {
        // Preço SUBIU: Apostar "subir" = continuar tendência = menor odd (1.10)
        baseOddsUp = algorithmConfig.algo2_odds_low;      // Subir = 1.10X
        baseOddsDown = algorithmConfig.algo2_odds_high;  // Descer = 1.90X
        console.log('🔵 Algoritmo 2: Preço SUBIU | Opening:', openingPrice, '< Current:', currentPrice, '| Subir =', algorithmConfig.algo2_odds_low, '| Descer =', algorithmConfig.algo2_odds_high);
      } else if (openingPrice > currentPrice) {
        // Preço DESCEU: Apostar "descer" = continuar tendência = menor odd (1.10)
        baseOddsUp = algorithmConfig.algo2_odds_high;    // Subir = 1.90X
        baseOddsDown = algorithmConfig.algo2_odds_low;   // Descer = 1.10X
        console.log('🔴 Algoritmo 2: Preço DESCEU | Opening:', openingPrice, '> Current:', currentPrice, '| Subir =', algorithmConfig.algo2_odds_high, '| Descer =', algorithmConfig.algo2_odds_low);
      }
      
      // Adjust odds as price approaches opening price
      const maxDeviation = Math.abs(openingPrice * 0.01); // 1% of opening price
      const currentDeviation = Math.abs(priceDiff);
      const adjustmentFactor = Math.max(0, 1 - (currentDeviation / maxDeviation));
      
      const midPoint = (algorithmConfig.algo2_odds_high + algorithmConfig.algo2_odds_low) / 2;
      
      const oddsUp = baseOddsUp + (midPoint - baseOddsUp) * adjustmentFactor;
      const oddsDown = baseOddsDown + (midPoint - baseOddsDown) * adjustmentFactor;
      
      console.log('📊 Odds finais:', side, '| Subir:', oddsUp.toFixed(2), '| Descer:', oddsDown.toFixed(2));
      
      return side === 'subiu' ? oddsUp : oddsDown;
    }

    // Algorithm 1: Dynamic time-based
    const duration = algorithmConfig.pool_duration_seconds;
    const lockout = algorithmConfig.lockout_time_seconds;
    const oddsStart = algorithmConfig.odds_start;
    const oddsEnd = algorithmConfig.odds_end;
    
    const timeElapsed = duration - countdown;
    const effectiveTime = duration - lockout; // Time before lockout
    
    if (timeElapsed >= effectiveTime) {
      // During lockout period
      return oddsEnd;
    }
    
    // Calculate progress through the effective time
    const progress = timeElapsed / effectiveTime;
    const oddsDiff = oddsStart - oddsEnd;
    
    // Linear decrease from start to end odds
    return Math.max(oddsEnd, oddsStart - (progress * oddsDiff));
  };

  const handleBet = async (side: 'subiu' | 'desceu') => {
    console.log('🎯 handleBet called', { poolId: currentPool?.id, side, countdown, betAmount });
    
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

    // Check if countdown is in lockout period
    if (countdown <= 2) {
      toast({
        title: "Opiniões bloqueadas",
        description: "Não é possível opinar nos últimos 2 segundos",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check user balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('saldo_moeda')
        .eq('id', user.id)
        .single();

      console.log('👤 User balance:', profile?.saldo_moeda);

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      if (!profile || profile.saldo_moeda < betAmount) {
        toast({
          title: "Saldo insuficiente",
          description: "Você não tem saldo suficiente para esta opinião",
          variant: "destructive"
        });
        return;
      }

      // Calculate odds first
      const odds = getOdds(side);
      console.log('📊 Calculated odds:', odds);

      // Create bet first (deduct later to ensure atomicity)
      const { data: betData, error: betError } = await supabase
        .from('fast_pool_bets')
        .insert({
          user_id: user.id,
          pool_id: currentPool.id,
          side: side,
          amount_rioz: betAmount,
          odds: odds
        })
        .select()
        .single();

      if (betError) {
        console.error('Bet error:', betError);
        throw betError;
      }

      console.log('✅ Bet created:', betData);

      // Deduct balance after bet is confirmed
      const { error: deductError } = await supabase
        .from('profiles')
        .update({ saldo_moeda: profile.saldo_moeda - betAmount })
        .eq('id', user.id);

      if (deductError) {
        console.error('Deduct error:', deductError);
        // If balance deduction fails, we should ideally delete the bet, but for now just throw
        throw deductError;
      }

      console.log('✅ Bet placed successfully!');

      // Add opinion notification
      const newNotification = {
        id: Date.now().toString(),
        text: 'Opinião registrada',
        side: side,
        timestamp: Date.now()
      };
      setOpinionNotifications(prev => [...prev, newNotification]);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        setOpinionNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 3000);

      // Show toast notification
      toast({
        title: "✅ Opinião registrada!",
        description: `${side === 'subiu' ? '📈 SUBIR' : '📉 DESCER'} • ${betAmount} RZ • Odds: x${odds.toFixed(2)}`,
        duration: 3000,
        className: side === 'subiu' 
          ? 'border-[#00ff90] bg-[#00ff90]/10 text-foreground' 
          : 'border-[#ff2389] bg-[#ff2389]/10 text-foreground'
      });
      
      // Force profile refresh for instant balance update
      console.log('🔄 Force refresh triggered for profile:', user.id);
      window.dispatchEvent(new CustomEvent('forceProfileRefresh'));
      
    } catch (error) {
      console.error('❌ Error placing bet:', error);
      toast({
        title: "Erro ao registrar opinião",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative">
      {/* Opinion Notifications - Bottom right above Riana chat */}
      <div className="fixed bottom-24 right-6 z-50 pointer-events-none space-y-2">
        {opinionNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-6 py-3 rounded-full font-semibold text-sm shadow-lg animate-fade-in pointer-events-auto ${
              notification.side === 'subiu'
                ? 'bg-[#00ff90] text-black'
                : 'bg-[#ff2389] text-white'
            }`}
            style={{
              animation: 'fade-in 0.3s ease-out, fade-out 0.3s ease-out 2.7s'
            }}
          >
            {notification.text}
          </div>
        ))}
      </div>

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
                    disabled={countdown <= algorithmConfig.lockout_time_seconds}
                    className="h-12 text-sm font-semibold bg-[#00ff90] hover:bg-[#00ff90]/90 text-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between w-full px-1">
                      <ArrowUp className="w-4 h-4" />
                      <span>Subir</span>
                      <span className="text-xs opacity-80">
                        x{getOdds('subiu').toFixed(2)}
                      </span>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => handleBet('desceu')}
                    disabled={countdown <= algorithmConfig.lockout_time_seconds}
                    className="h-12 text-sm font-semibold bg-[#ff2389] hover:bg-[#ff2389]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between w-full px-1">
                      <ArrowDown className="w-4 h-4" />
                      <span>Descer</span>
                      <span className="text-xs opacity-80">
                        x{getOdds('desceu').toFixed(2)}
                      </span>
                    </div>
                  </Button>
                </div>
              )}

              {countdown <= algorithmConfig.lockout_time_seconds && countdown > 0 && (
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
            poolStartPrice={
              // Between pools or first 3 seconds: follow current price
              countdown <= 0 || countdown >= 57 
                ? currentPrice 
                : currentPool.opening_price // After 3s: use fixed opening_price
            }
            onPriceChange={setCurrentPrice}
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
                      onClick={() => {
                        setSelectedResult(result);
                        setResultModalOpen(true);
                      }}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg border transition-all duration-300 cursor-pointer hover:scale-105",
                        result.result === 'subiu' 
                          ? 'bg-[#00ff90]/10 border-[#00ff90]/30 hover:bg-[#00ff90]/20' 
                          : result.result === 'desceu'
                          ? 'bg-[#ff2389]/10 border-[#ff2389]/30 hover:bg-[#ff2389]/20'
                          : 'bg-muted/20 border-border hover:bg-muted/30'
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

      {/* Result Details Modal */}
      <PoolResultModal
        open={resultModalOpen}
        onOpenChange={setResultModalOpen}
        result={selectedResult}
        pool={selectedResult?.fast_pools ? {
          round_start_time: selectedResult.fast_pools.round_start_time,
          round_end_time: selectedResult.fast_pools.round_end_time,
          asset_name: selectedResult.fast_pools.asset_name
        } : null}
      />
    </div>
  );
};

export default AssetDetail;
