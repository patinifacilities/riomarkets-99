import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Zap, Clock, BarChart3, Wallet, Plus, ArrowUpDown, ArrowUp, ArrowDown, Bitcoin, DollarSign, Coins, TrendingUpIcon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';
import { FastMarketTermsModal } from '@/components/fast/FastMarketTermsModal';
import { FastPoolHistoryModal } from '@/components/fast/FastPoolHistoryModal';
import { DarkModeToggle } from '@/components/layout/DarkModeToggle';
import { Link } from 'react-router-dom';

interface FastPool {
  id: string;
  round_number: number;
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
  result?: string;
}

interface FastPoolResult {
  id: string;
  result: 'subiu' | 'desceu' | 'manteve';
  opening_price: number;
  closing_price: number;
  price_change_percent: number;
  created_at: string;
  asset_symbol: string;
}

const Fast = () => {
  const [currentPools, setCurrentPools] = useState<FastPool[]>([]);
  const [poolHistory, setPoolHistory] = useState<Record<string, FastPoolResult[]>>({});
  const [countdown, setCountdown] = useState(60);
  const [betAmount, setBetAmount] = useState(100);
  const [clickedPool, setClickedPool] = useState<{id: string, side: string} | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [poolHistoryOpen, setPoolHistoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('commodities');
  const [lastPoolIds, setLastPoolIds] = useState<string[]>([]);
  const [opinionNotifications, setOpinionNotifications] = useState<{id: string, text: string, side?: 'subiu' | 'desceu', timestamp: number}[]>([]);
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();

  // Category options for fast pools with styling
  const categoryOptions = [
    { 
      value: 'commodities', 
      label: window.innerWidth <= 768 ? 'Commod' : 'Commodities', 
      bgColor: '#FFD800',
      icon: '🛢️',
      textColor: '#000'
    },
    { 
      value: 'crypto', 
      label: 'Cripto', 
      bgColor: '#FF6101',
      icon: '₿',
      textColor: '#fff'
    },
    { 
      value: 'forex', 
      label: 'Forex', 
      bgColor: '#ff2389',
      icon: '$',
      textColor: '#fff'
    },
    { 
      value: 'stocks', 
      label: 'Ações', 
      bgColor: '#00ff90',
      icon: '📈',
      textColor: '#000'
    }
  ];

  // Realtime subscription for pool updates
  useEffect(() => {
    const channel = supabase
      .channel('fast-pools-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fast_pools'
        },
        (payload) => {
          console.log('Pool update:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            loadCurrentPools();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fast_pool_results'
        },
        (payload) => {
          console.log('New result:', payload);
          loadPoolHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Check if user has already accepted terms on mount
  useEffect(() => {
    const hasAcceptedTerms = localStorage.getItem('fastMarketsTermsAccepted');
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
    }
  }, []);

  // Load current pools and history
  const loadCurrentPools = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-fast-pools', {
        body: { 
          action: 'get_current_pool',
          category: selectedCategory 
        }
      });
      
      if (error) throw error;
      
      if (data?.pools) {
        setCurrentPools(data.pools);
        if (data.pools.length > 0) {
          calculateCountdown(data.pools[0]); // All pools have same timing
        }
      }
    } catch (error) {
      console.error('Error loading pools:', error);
    }
  }, [selectedCategory]);

  // Load pool history by category and check for new results
  const loadPoolHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('fast_pool_results')
        .select('*, fast_pools!inner(category)')
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      
      // Group results by category
      const resultsByCategory: Record<string, FastPoolResult[]> = {};
      
      (data || []).forEach((item: any) => {
        const category = item.fast_pools.category;
        const result = {
          ...item,
          result: item.result as 'subiu' | 'desceu' | 'manteve'
        };
        
        if (!resultsByCategory[category]) {
          resultsByCategory[category] = [];
        }
        
        if (resultsByCategory[category].length < 10) {
          resultsByCategory[category].push(result);
        }
      });
      
      setPoolHistory(resultsByCategory);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, []);

  // Calculate countdown based on pool end time
  const calculateCountdown = useCallback((pool: FastPool) => {
    const now = new Date().getTime();
    const endTime = new Date(pool.round_end_time).getTime();
    const timeLeft = Math.max(0, (endTime - now) / 1000); // Keep decimals for smooth animation
    setCountdown(timeLeft);
    
    // Check if this is a new set of pools (first second)
    if (timeLeft === 59 && !lastPoolIds.includes(pool.id)) {
      setLastPoolIds([pool.id]);
      
      // Show results for this category if available
      const categoryHistory = poolHistory[selectedCategory];
      if (categoryHistory && categoryHistory.length > 0) {
        const lastResult = categoryHistory[0];
        setTimeout(() => {
          toast({
            title: lastResult.result === 'subiu' ? "Subiu! 📈" : lastResult.result === 'desceu' ? "Desceu! 📉" : "Manteve! ➡️",
            description: `${lastResult.asset_symbol}: ${lastResult.price_change_percent > 0 ? '+' : ''}${lastResult.price_change_percent.toFixed(2)}%`,
            duration: 2000,
            className: lastResult.result === 'subiu' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 
                      lastResult.result === 'desceu' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 
                      'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
          });
        }, 500);
      }
    }
  }, [lastPoolIds, poolHistory, selectedCategory, toast]);

  // Initialize and reload when category changes
  useEffect(() => {
    loadCurrentPools();
    loadPoolHistory();
  }, [loadCurrentPools, loadPoolHistory, selectedCategory]);

  // Countdown timer with smooth updates
  useEffect(() => {
    if (!currentPools.length || countdown <= 0) return;
    
    const timer = setInterval(() => {
      calculateCountdown(currentPools[0]); // All pools have same timing
    }, 16); // Update every 16ms for 60fps smooth animation

    return () => clearInterval(timer);
  }, [currentPools, countdown, calculateCountdown]);

  // Pool finalization and new pool creation
  useEffect(() => {
    if (countdown <= 0 && currentPools.length > 0) {
      finalizePools();
    }
  }, [countdown, currentPools]);

  const finalizePools = async () => {
    if (!currentPools.length) return;
    
    try {
      // Finalize all pools in parallel
      await Promise.all(
        currentPools.map(pool => 
          supabase.functions.invoke('manage-fast-pools', {
            body: { 
              action: 'finalize_pool',
              poolId: pool.id 
            }
          })
        )
      );
      
      // Immediately load new pools and history
      loadCurrentPools();
      loadPoolHistory();
      
    } catch (error) {
      console.error('Error finalizing pools:', error);
    }
  };

  // Calculate dynamic odds based on countdown - now decreasing by 1
  const getOdds = () => {
    const timeElapsed = 60 - countdown;
    
    if (timeElapsed <= 28) {
      // First 28 seconds: 1.80x to 1.20x
      const progress = timeElapsed / 28;
      return Math.max(1.20, 1.80 - (progress * 0.60));
    } else if (timeElapsed <= 50) {
      // 28-50 seconds (22 seconds): 1.20x to 1.10x
      const progress = (timeElapsed - 28) / 22;
      return Math.max(1.10, 1.20 - (progress * 0.10));
    } else {
      // Last 10 seconds: 1.10x
      return 1.10;
    }
  };

  // Play coin sound effect for profit
  const playCoinSound = () => {
    const audio = new Audio('/sounds/coin.mp3');
    audio.volume = 0.3;
    audio.play().catch(console.error);
  };

  // Check for user winnings for the recently completed pool
  const checkForWinnings = useCallback(async (poolId: string, betSide: 'subiu' | 'desceu') => {
    if (!user) return;
    
    try {
      // Wait for pool to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: bet } = await supabase
        .from('fast_pool_bets')
        .select('*, fast_pool_results(*)')
        .eq('user_id', user.id)
        .eq('pool_id', poolId)
        .single();
        
      if (bet && bet.processed && bet.payout_amount > 0) {
        playCoinSound();
        const winAmount = bet.payout_amount - bet.amount_rioz;
        toast({
          title: "🎉 Você ganhou!",
          description: `Parabéns! Você ganhou ${winAmount.toFixed(0)} RZ`,
          duration: 6000,
          className: 'bg-[#00ff90]/10 border-[#00ff90]'
        });
      }
    } catch (error) {
      console.error('Error checking winnings:', error);
    }
  }, [user, toast]);

  const handleBet = async (poolId: string, side: 'subiu' | 'desceu') => {
    if (!user || !currentPools.length) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado e ter pools ativos.",
        variant: "destructive"
      });
      return;
    }

    const pool = currentPools.find(p => p.id === poolId);
    if (!pool) return;

    if (countdown <= 15) {
      toast({
        title: "Tempo esgotado",
        description: "Não é possível opinar nos últimos 15 segundos.",
        variant: "destructive"
      });
      return;
    }

    if (!profile?.saldo_moeda || profile.saldo_moeda < betAmount) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem saldo suficiente para esta opinião.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Deduct bet amount from user balance
      const { error: deductError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -betAmount
      });

      if (deductError) throw deductError;

      // Place bet
      const { error: betError } = await supabase
        .from('fast_pool_bets')
        .insert({
          user_id: user.id,
          pool_id: poolId,
          side: side,
          amount_rioz: betAmount,
          odds: getOdds()
        });

      if (betError) throw betError;

      // Add click animation
      setClickedPool({ id: poolId, side });
      setTimeout(() => setClickedPool(null), 400);

      // Add new opinion notification with button color
      const newNotification = {
        id: Date.now().toString(),
        text: 'Opinião registrada',
        side: side,
        timestamp: Date.now()
      };
      setOpinionNotifications(prev => [...prev, newNotification]);
      
      // Remove notification after exactly 3 seconds with fadeout
      setTimeout(() => {
        setOpinionNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 3000);

      // Register transaction in wallet_transactions
      await supabase
        .from('wallet_transactions')
        .insert({
          id: `fast_bet_${Date.now()}_${user.id}`,
          user_id: user.id,
          tipo: 'debito',
          valor: betAmount,
          descricao: `Fast Market - ${side === 'subiu' ? 'Subiu' : 'Desceu'} - ${pool.asset_name}`,
          market_id: poolId
        });

      // Refresh profile and check for winnings after pool finishes
      refetchProfile();
      
      // Check for winnings after pool finishes (65 seconds + processing time)
      setTimeout(() => {
        checkForWinnings(poolId, side);
      }, 65000);

    } catch (error) {
      console.error('Bet error:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar opinião. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const openHistoryModal = () => {
    setSelectedPool(selectedCategory);
    setPoolHistoryOpen(true);
  };

  if (!currentPools.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando Fast Markets...</p>
        </div>
      </div>
    );
  }

  // Get pool icon based on asset symbol
  const getPoolIcon = (assetSymbol: string) => {
    const iconMap: Record<string, any> = {
      'BTC': Bitcoin,
      'ETH': Coins,
      'SOL': Coins,
      'OIL': () => <span className="text-lg">🛢️</span>,
      'GOLD': () => <span className="text-lg">🏆</span>,
      'SILVER': () => <span className="text-lg">🥈</span>,
      'BRL/USD': DollarSign,
      'EUR/USD': DollarSign,
      'JPY/USD': DollarSign,
      'TSLA': TrendingUpIcon,
      'AAPL': TrendingUpIcon,
      'AMZN': TrendingUpIcon
    };
    
    const IconComponent = iconMap[assetSymbol];
    return IconComponent ? (typeof IconComponent === 'function' && IconComponent.name === '' ? <IconComponent /> : <IconComponent className="w-5 h-5" />) : <BarChart3 className="w-5 h-5" />;
  };

  const currentCategoryHistory = poolHistory[selectedCategory] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hide elements on mobile and add animations */}
      <style>{`
        @media (max-width: 768px) {
          .riana-chat-button,
          .dark-mode-toggle-duplicate,
          .header-dark-toggle,
          [data-testid="dark-mode-toggle"],
          .fixed-dark-mode-toggle {
            display: none !important;
          }
        }
        
        @keyframes outline-animation-commodities {
          0% { border-color: transparent; }
          50% { border-color: #FFD800; box-shadow: 0 0 10px #FFD800; }
          100% { border-color: transparent; }
        }
        
        @keyframes outline-animation-crypto {
          0% { border-color: transparent; }
          50% { border-color: #FF6101; box-shadow: 0 0 10px #FF6101; }
          100% { border-color: transparent; }
        }
        
        @keyframes outline-animation-forex {
          0% { border-color: transparent; }
          50% { border-color: #ff2389; box-shadow: 0 0 10px #ff2389; }
          100% { border-color: transparent; }
        }
        
        @keyframes outline-animation-stocks {
          0% { border-color: transparent; }
          50% { border-color: #00ff90; box-shadow: 0 0 10px #00ff90; }
          100% { border-color: transparent; }
        }
        
        @keyframes rearrange-in {
          0% { 
            transform: translateY(-20px) scale(0.95); 
            opacity: 0; 
          }
          100% { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
          }
        }
        
        @keyframes fadeout {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes outline-animation-crypto {
          0% { border-color: transparent; }
          50% { border-color: #FF6101; box-shadow: 0 0 10px #FF6101; }
          100% { border-color: transparent; }
        }
        
        @keyframes outline-animation-forex {
          0% { border-color: transparent; }
          50% { border-color: #ff2389; box-shadow: 0 0 10px #ff2389; }
          100% { border-color: transparent; }
        }
        
        @keyframes outline-animation-stocks {
          0% { border-color: transparent; }
          50% { border-color: #00ff90; box-shadow: 0 0 10px #00ff90; }
          100% { border-color: transparent; }
        }
      `}</style>
      
      <div className="container mx-auto px-4 pt-8 pb-20">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff2389]/10 to-[#ff2389]/5 px-6 py-3 rounded-full border border-[#ff2389]/20 mb-4">
            <Zap className="w-5 h-5 text-[#ff2389] animate-pulse" />
            <span className="text-[#ff2389] font-semibold tracking-wide">FAST MARKETS</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Pools de opinião de <span className="text-primary">60 segundos</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Opine se o ativo vai subir ou descer nos próximos 60 segundos. Odds dinâmicas baseadas em dados reais de mercado.
          </p>
          
          {/* Category Selector */}
          <div className="flex justify-center items-center mb-6">
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
              {categoryOptions.map((category) => (
                <Button
                  key={category.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className={cn(
                    "transition-all duration-75 font-medium rounded-xl",
                    selectedCategory === category.value 
                      ? "shadow-sm border" 
                      : "hover:bg-muted-foreground/10"
                  )}
                  style={selectedCategory === category.value ? {
                    backgroundColor: category.bgColor,
                    color: category.textColor,
                    borderColor: category.bgColor
                  } : {}}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Pools Grid */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            {currentPools.map((pool, index) => (
              <Card key={pool.id} className={cn(
                "relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm",
                (pool as any).paused && "opacity-50 grayscale"
              )}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[#ff2389]/5"></div>
                
                {(pool as any).paused && (
                  <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <div className="text-4xl mb-2">⏸️</div>
                      <p className="text-white font-semibold">Pool Pausado</p>
                      <p className="text-white/70 text-sm">Aguarde retorno</p>
                    </div>
                  </div>
                )}
                
                <CardHeader className="relative z-10 text-center pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getPoolIcon(pool.asset_symbol)}
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                        Pool #{pool.round_number}
                      </Badge>
                    </div>
                    {index === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={openHistoryModal}
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Histórico
                      </Button>
                    )}
                  </div>
                  
                  <CardTitle className="text-lg mb-2">
                    {pool.asset_name}
                  </CardTitle>
                  
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span className="bg-muted/50 px-2 py-1 rounded">{pool.asset_symbol}</span>
                    <span>•</span>
                    <span>${pool.opening_price.toLocaleString()}</span>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 space-y-4">

                  {/* Bet Amount Slider and Countdown - shared across all pools */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium">
                      Opinar {betAmount} RZ
                    </label>
                    <div className="px-3 py-2 bg-muted/20 rounded-lg">
                      <input
                        type="range"
                        min="1"
                        max="1000"
                        step="1"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="w-full h-6 bg-muted rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #00ff90 0%, #00ff90 ${((betAmount - 1) / 999) * 100}%, hsl(var(--muted)) ${((betAmount - 1) / 999) * 100}%, hsl(var(--muted)) 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1 RZ</span>
                        <span>1.000 RZ</span>
                      </div>
                    </div>
                  </div>

                   {/* Countdown Timer */}
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-2 ${
                        countdown <= 0 
                          ? 'text-muted-foreground animate-pulse' 
                          : 'text-[#ff2389]'
                      }`}>
                         {countdown > 0 ? `${countdown.toFixed(2)}s` : 'Aguarde...'}
                       </div>
                      <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full bg-gradient-to-r from-[#ff2389] to-[#ff2389]/80",
                            countdown <= 15 && countdown > 5 && "animate-pulse duration-1000",
                            countdown <= 5 && "animate-pulse duration-300"
                          )}
                           style={{ 
                             width: `${(countdown / 60) * 100}%`,
                             transition: 'width 16ms linear'
                           }}
                        />
                      </div>
                   </div>

                  {/* Opinion Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleBet(pool.id, 'subiu')}
                      disabled={countdown <= 15}
                      className={`h-12 text-sm font-semibold transition-all duration-300 ${
                        clickedPool?.id === pool.id && clickedPool?.side === 'subiu'
                          ? 'scale-[1.02] shadow-lg shadow-[#00ff90]/30 ring-2 ring-[#00ff90]/50 animate-pulse'
                          : ''
                      } bg-[#00ff90] hover:bg-[#00ff90]/90 text-black`}
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
                      onClick={() => handleBet(pool.id, 'desceu')}
                      disabled={countdown <= 15}
                      className={`h-12 text-sm font-semibold transition-all duration-300 ${
                        clickedPool?.id === pool.id && clickedPool?.side === 'desceu'
                          ? 'scale-[1.02] shadow-lg shadow-[#ff2389]/30 ring-2 ring-[#ff2389]/50 animate-pulse'
                          : ''
                      } bg-[#ff2389] hover:bg-[#ff2389]/90 text-white`}
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

                   {countdown <= 15 && (
                     <div className="text-center text-xs text-muted-foreground">
                       Opiniões bloqueadas
                     </div>
                   )}
                  
                  {!user && (
                    <div className="absolute inset-0 top-10 bg-black/60 backdrop-blur-md rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-white text-sm font-medium mb-3">Login necessário</p>
                        <Link to="/auth">
                          <Button size="sm" className="bg-[#00ff90] text-black hover:bg-[#00ff90]/90 font-semibold">
                            Fazer Login
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Results for Current Category */}
        {currentCategoryHistory.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5" />
                  Últimos Resultados - {categoryOptions.find(c => c.value === selectedCategory)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                   {currentCategoryHistory.slice(0, 10).map((result, index) => (
                     <div
                       key={result.id}
                       className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-200 relative ${
                         index < 3 
                           ? `bg-primary/10 border-primary/30 shadow-sm ring-1 ring-primary/20`
                           : 'bg-muted/20 border-border'
                       }`}
                     >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        result.result === 'subiu' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : result.result === 'desceu'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-gray-100 dark:bg-gray-900/30'
                      }`}>
                        {result.result === 'subiu' ? (
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : result.result === 'desceu' ? (
                          <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">=</span>
                        )}
                      </div>
                      <span className="text-xs font-medium">{result.asset_symbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {result.price_change_percent > 0 ? '+' : ''}{result.price_change_percent.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Cards */}
        <div className="max-w-4xl mx-auto mt-12 grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Zap className="w-5 h-5" />
                Como Funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <p>• Cada pool dura exatamente 60 segundos</p>
                <p>• 3 pools simultâneos por categoria</p>
                <p>• Opine se o ativo vai subir (SIM) ou descer (NÃO)</p>
                <p>• Resultado baseado em dados reais de mercado</p>
                <p>• Odds dinâmicas que diminuem com o tempo</p>
                <p>• Apostas bloqueadas nos últimos 10 segundos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#ff2389]/5 via-transparent to-transparent border-[#ff2389]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#ff2389]">
                <BarChart3 className="w-5 h-5" />
                Categorias Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <p>• <strong>Commodities:</strong> Petróleo, Ouro, Prata</p>
                <p>• <strong>Cripto:</strong> Bitcoin, Ethereum, Solana</p>
                <p>• <strong>Forex:</strong> BRL/USD, EUR/USD, JPY/USD</p>
                <p>• <strong>Ações:</strong> Tesla, Apple, Amazon</p>
                <p>• Todos sincronizados em tempo real</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {!user && (
          <div className="max-w-4xl mx-auto mt-8">
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  Login Necessário para Opinar
                </h3>
                <p className="text-orange-600 dark:text-orange-300 mb-4">
                  Você pode visualizar os Fast Markets, mas precisa estar logado para enviar suas opiniões e participar dos pools.
                </p>
                <Link to="/auth">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    Fazer Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Terms Button at Bottom */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTermsModal(true)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <AlertTriangle className="w-4 h-4" />
            Termos Fast Markets
          </Button>
        </div>
      </div>

      {/* Opinion Notifications Stack - Below header ticker */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-30 space-y-2 max-w-md w-full px-4">
        {opinionNotifications.map((notification, index) => (
          <div 
            key={notification.id}
            className={`px-6 py-3 rounded-xl shadow-lg border animate-scale-in transition-opacity duration-300 ${
              notification.side === 'subiu' 
                ? 'bg-[#00ff90] text-black border-[#00ff90]' 
                : 'bg-[#ff2389] text-white border-[#ff2389]'
            }`}
            style={{ 
              zIndex: 30 - index 
            }}
          >
            <p className="font-medium">{notification.text}</p>
          </div>
        ))}
      </div>

      {/* Modals */}
      <FastMarketTermsModal 
        open={showTermsModal} 
        onOpenChange={setShowTermsModal}
        onAccept={() => {
          localStorage.setItem('fastMarketsTermsAccepted', 'true');
          setShowTermsModal(false);
        }}
      />
      
      <FastPoolHistoryModal
        open={poolHistoryOpen}
        onOpenChange={setPoolHistoryOpen}
        assetSymbol={selectedPool || selectedCategory}
        timeLeft={countdown}
      />
    </div>
  );
};

export default Fast;