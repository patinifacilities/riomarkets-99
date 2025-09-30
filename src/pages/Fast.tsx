import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Zap, Clock, BarChart3, Wallet, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
}

const Fast = () => {
  const [currentPool, setCurrentPool] = useState<FastPool | null>(null);
  const [poolHistory, setPoolHistory] = useState<FastPoolResult[]>([]);
  const [countdown, setCountdown] = useState(60);
  const [betAmount, setBetAmount] = useState(100);
  const [clickedPool, setClickedPool] = useState<{id: string, side: string} | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [poolHistoryOpen, setPoolHistoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('commodities');
  const [lastPoolId, setLastPoolId] = useState<string | null>(null);
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();

  // Category options for fast pools
  const categoryOptions = [
    { value: 'commodities', label: 'Commodities' },
    { value: 'crypto', label: 'Cripto' },
    { value: 'forex', label: 'Forex' },
    { value: 'stocks', label: 'Ações' }
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
            loadCurrentPool();
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

  // Check if user has already accepted terms and is logged in
  useEffect(() => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para acessar os Fast Markets.",
        variant: "destructive"
      });
      return;
    }
    
    const hasAcceptedTerms = localStorage.getItem('fastMarketsTermsAccepted');
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
    }
  }, [user, toast]);

  // Load current pool and history
  const loadCurrentPool = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-fast-pools', {
        body: { action: 'get_current_pool' }
      });
      
      if (error) throw error;
      
      if (data?.pool) {
        setCurrentPool(data.pool);
        calculateCountdown(data.pool);
      }
    } catch (error) {
      console.error('Error loading pool:', error);
    }
  }, []);

  // Load pool history and check for new results
  const loadPoolHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('fast_pool_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      const typedResults = (data || []).map(result => ({
        ...result,
        result: result.result as 'subiu' | 'desceu' | 'manteve'
      }));
      
      // Check if there's a new result to show notification
      const lastResult = typedResults[0];
      const lastShownResult = localStorage.getItem('lastShownFastResult');
      
      if (lastResult && lastResult.id !== lastShownResult) {
        // Show result notification
        setTimeout(() => {
          toast({
            title: lastResult.result === 'subiu' ? "Subiu! 📈" : lastResult.result === 'desceu' ? "Desceu! 📉" : "Manteve! ➡️",
            description: `Variação: ${lastResult.price_change_percent > 0 ? '+' : ''}${lastResult.price_change_percent.toFixed(2)}%`,
            duration: 4000,
          });
        }, 1000);
        
        localStorage.setItem('lastShownFastResult', lastResult.id);
      }
      
      setPoolHistory(typedResults);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, [toast]);

  // Calculate countdown based on pool end time
  const calculateCountdown = useCallback((pool: FastPool) => {
    const now = new Date().getTime();
    const endTime = new Date(pool.round_end_time).getTime();
    const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
    setCountdown(timeLeft);
    
    // Check if this is a new pool (first second)
    if (timeLeft === 59 && pool.id !== lastPoolId) {
      setLastPoolId(pool.id);
      
      // Get the last result to show notification
      if (poolHistory.length > 0) {
        const lastResult = poolHistory[0];
        setTimeout(() => {
          toast({
            title: lastResult.result === 'subiu' ? "Subiu! 📈" : lastResult.result === 'desceu' ? "Desceu! 📉" : "Manteve! ➡️",
            description: `Variação: ${lastResult.price_change_percent > 0 ? '+' : ''}${lastResult.price_change_percent.toFixed(2)}%`,
            duration: 2000,
            className: lastResult.result === 'subiu' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 
                      lastResult.result === 'desceu' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 
                      'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
          });
        }, 500);
      }
    }
  }, [lastPoolId, poolHistory, toast]);

  // Initialize
  useEffect(() => {
    loadCurrentPool();
    loadPoolHistory();
  }, [loadCurrentPool, loadPoolHistory]);

  // Countdown timer with smooth updates
  useEffect(() => {
    if (!currentPool || countdown <= 0) return;
    
    const timer = setInterval(() => {
      calculateCountdown(currentPool);
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(timer);
  }, [currentPool, countdown, calculateCountdown]);

  // Pool finalization and new pool creation
  useEffect(() => {
    if (countdown <= 0 && currentPool) {
      finalizePool();
    }
  }, [countdown, currentPool]);

  const finalizePool = async () => {
    if (!currentPool) return;
    
    try {
      await supabase.functions.invoke('manage-fast-pools', {
        body: { 
          action: 'finalize_pool',
          poolId: currentPool.id 
        }
      });
      
      // Wait a moment then load new pool
      setTimeout(() => {
        loadCurrentPool();
        loadPoolHistory();
      }, 2000);
      
    } catch (error) {
      console.error('Error finalizing pool:', error);
    }
  };

  // Calculate dynamic odds based on countdown
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

  // Check for user winnings
  const checkForWinnings = useCallback(async () => {
    if (!user || !currentPool) return;
    
    try {
      const { data: winningBets } = await supabase
        .from('fast_pool_bets')
        .select('*')
        .eq('user_id', user.id)
        .eq('pool_id', currentPool.id)
        .eq('processed', true)
        .gt('payout_amount', 0);
        
      if (winningBets && winningBets.length > 0) {
        const totalWinnings = winningBets.reduce((sum, bet) => sum + bet.payout_amount, 0);
        toast({
          title: "🎉 Você ganhou!",
          description: `Parabéns! Você recebeu ${totalWinnings.toFixed(0)} RZ`,
          duration: 6000,
        });
      }
    } catch (error) {
      console.error('Error checking winnings:', error);
    }
  }, [user, currentPool, toast]);

  const handleBet = async (side: 'subiu' | 'desceu') => {
    if (!user || !currentPool) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado e ter um pool ativo.",
        variant: "destructive"
      });
      return;
    }

    if (countdown <= 10) {
      toast({
        title: "Tempo esgotado",
        description: "Não é possível opinar nos últimos 10 segundos.",
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
          pool_id: currentPool.id,
          side: side,
          amount_rioz: betAmount,
          odds: getOdds()
        });

      if (betError) throw betError;

      // Add click animation
      setClickedPool({ id: currentPool.id, side });
      setTimeout(() => setClickedPool(null), 400);

      toast({
        title: "Opinião enviada!",
        description: `Opinião de ${betAmount} RZ em "${side === 'subiu' ? 'Subir' : 'Descer'}" confirmada.`,
      });

      // Refresh profile and check for winnings after a delay
      refetchProfile();
      
      // Check for winnings after pool finishes (65 seconds + processing time)
      setTimeout(() => {
        checkForWinnings();
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
    if (currentPool) {
      setSelectedPool(currentPool.asset_symbol);
      setPoolHistoryOpen(true);
    }
  };

  if (!currentPool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando Fast Markets...</p>
        </div>
      </div>
    );
  }

  // Show login warning for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 pt-8 pb-20">
          {/* Theme toggle */}
          <div className="absolute top-4 right-4">
            <DarkModeToggle />
          </div>
          
          {/* Login warning */}
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md mx-auto text-center">
              <CardHeader>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff2389]/10 to-[#ff2389]/5 px-6 py-3 rounded-full border border-[#ff2389]/20 mb-4 mx-auto w-fit">
                  <Zap className="w-5 h-5 text-[#ff2389] animate-pulse" />
                  <span className="text-[#ff2389] font-semibold tracking-wide">FAST MARKETS</span>
                </div>
                <CardTitle className="text-2xl mb-2">Login Necessário</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Você precisa estar logado para acessar os Fast Markets e enviar suas opiniões.
                </p>
                <Link to="/auth">
                  <Button className="w-full">
                    Fazer Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 pt-8 pb-20">
        {/* Theme toggle */}
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        
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
          <div className="flex justify-center mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Current Pool Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[#ff2389]/5"></div>
            
            <CardHeader className="relative z-10 text-center pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Pool #{currentPool.round_number}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openHistoryModal}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Histórico
                </Button>
              </div>
              
              <CardTitle className="text-xl md:text-2xl mb-2">
                {currentPool.question}
              </CardTitle>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="bg-muted/50 px-2 py-1 rounded">{currentPool.asset_name}</span>
                <span>•</span>
                <span>Preço atual: ${currentPool.opening_price.toLocaleString()}</span>
              </div>
            </CardHeader>

            <CardContent className="relative z-10 space-y-6">
              {/* Countdown */}
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#ff2389] mb-2">
                  {countdown}s
                </div>
                <div className="w-full bg-muted/20 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#ff2389] to-[#ff2389]/80 transition-all duration-[100ms] ease-linear"
                    style={{ 
                      width: `${(countdown / 60) * 100}%`,
                      transition: 'width 100ms linear'
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Tempo restante para opinar
                </p>
              </div>

              {/* Bet Amount Slider */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Opinar {betAmount} RZ
                </label>
                <div className="px-4 py-3 bg-muted/20 rounded-lg">
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    step="1"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
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

              {/* Opinion Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleBet('subiu')}
                  disabled={countdown <= 10}
                  className={`h-16 text-lg font-semibold transition-all duration-300 ${
                    clickedPool?.id === currentPool.id && clickedPool?.side === 'subiu'
                      ? 'scale-[1.02] shadow-lg shadow-[#00ff90]/30 ring-2 ring-[#00ff90]/50 animate-pulse'
                      : ''
                  } bg-[#00ff90] hover:bg-[#00ff90]/90 text-black`}
                >
                  <div className="flex items-center justify-between w-full px-2">
                    <ArrowUp className="w-6 h-6" />
                    <span>Subir</span>
                    <span className="text-sm opacity-80">
                      x{getOdds().toFixed(2)}
                    </span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleBet('desceu')}
                  disabled={countdown <= 10}
                  className={`h-16 text-lg font-semibold transition-all duration-300 ${
                    clickedPool?.id === currentPool.id && clickedPool?.side === 'desceu'
                      ? 'scale-[1.02] shadow-lg shadow-[#ff2389]/30 ring-2 ring-[#ff2389]/50 animate-pulse'
                      : ''
                  } bg-[#ff2389] hover:bg-[#ff2389]/90 text-white`}
                >
                  <div className="flex items-center justify-between w-full px-2">
                    <ArrowDown className="w-6 h-6" />
                    <span>Descer</span>
                    <span className="text-sm opacity-80">
                      x{getOdds().toFixed(2)}
                    </span>
                  </div>
                </Button>
              </div>

              {countdown <= 10 && (
                <div className="text-center text-sm text-muted-foreground">
                  ⏰ Opiniões bloqueadas nos últimos 10 segundos
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Results */}
        {poolHistory.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5" />
                  Últimos Resultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {poolHistory.slice(0, 10).map((result, index) => (
                    <div
                      key={result.id}
                      className="flex flex-col items-center p-3 rounded-lg bg-muted/20 border"
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
                Sistema de Odds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <p>• Odds iniciais baseadas no ativo</p>
                <p>• Redução gradual conforme o tempo passa</p>
                <p>• Odds mínimas de 1.0x nos últimos 25 segundos</p>
                <p>• Lucro calculado no momento da aposta</p>
                <p>• Pagamento automático para vencedores</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Fast Markets Terms Modal */}
      <FastMarketTermsModal
        open={showTermsModal}
        onOpenChange={setShowTermsModal}
        onAccept={() => {
          setShowTermsModal(false);
        }}
      />

      {/* Pool History Modal */}
      <FastPoolHistoryModal
        open={poolHistoryOpen}
        onOpenChange={setPoolHistoryOpen}
        assetSymbol={selectedPool || ''}
        timeLeft={countdown}
      />
      
      {/* Remove Riana Chat Button on Mobile - handled by CSS */}
      <style>{`
        @media (max-width: 768px) {
          .riana-chat-button { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Fast;