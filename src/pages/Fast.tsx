import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Zap, Clock, BarChart3, Wallet, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { FastBetSelector, useFastBetting } from '@/components/markets/FastBetSelector';
import { showFastWinNotification } from '@/components/layout/WinnerNotification';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';
import { FastMarketTermsModal } from '@/components/fast/FastMarketTermsModal';
import { Link } from 'react-router-dom';

const Fast = () => {
  const [countdown, setCountdown] = useState(60);
  const [currentRound, setCurrentRound] = useState(1);
  const [betAmount, setBetAmount] = useState(100);
  const [clickedPool, setClickedPool] = useState<{id: number, side: string} | null>(null);
  const [winnerResults, setWinnerResults] = useState<{[poolId: number]: string}>({});
  const [showWinnerBalance, setShowWinnerBalance] = useState<{amount: number, show: boolean}>({amount: 0, show: false});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  
  // Check if user has already accepted terms
  useEffect(() => {
    const hasAcceptedTerms = localStorage.getItem('fastMarketsTermsAccepted');
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
    }
  }, []);
  
  // Calculate dynamic odds based on countdown
  const getOdds = (baseOdds: number) => {
    const timeElapsed = 60 - countdown;
    if (timeElapsed >= 35) { // 25 seconds remaining
      return 1.0;
    }
    const reduction = (timeElapsed / 35) * (baseOdds - 1.0);
    return Math.max(1.0, baseOdds - reduction);
  };

  // Categories/themes for the fast pools
  const categories = [
    { id: 'crypto', name: 'Cripto', icon: '₿' },
    { id: 'commodities', name: 'Commodities', icon: '🛢️' },
    { id: 'forex', name: 'Forex', icon: '💱' },
    { id: 'stocks', name: 'Ações', icon: '📈' }
  ];

  const [selectedCategory, setSelectedCategory] = useState('commodities');

  // Sample pools based on category
  const pools = {
    commodities: [
      { 
        id: 1, 
        question: 'O Petróleo vai subir nos próximos 60 segundos?', 
        asset: 'Petróleo WTI',
        currentPrice: '$73.45',
        upOdds: 1.65,
        downOdds: 1.65
      },
      { 
        id: 2, 
        question: 'O Ouro vai descer nos próximos 60 segundos?', 
        asset: 'Ouro',
        currentPrice: '$2,018.30',
        upOdds: 1.65,
        downOdds: 1.65
      },
      { 
        id: 3, 
        question: 'A Prata vai subir nos próximos 60 segundos?', 
        asset: 'Prata',
        currentPrice: '$24.12',
        upOdds: 1.65,
        downOdds: 1.65
      }
    ],
    crypto: [
      { 
        id: 4, 
        question: 'O Bitcoin vai subir nos próximos 60 segundos?', 
        asset: 'Bitcoin',
        currentPrice: '$42,350.00',
        upOdds: 1.65,
        downOdds: 1.65
      },
      { 
        id: 5, 
        question: 'O Ethereum vai descer nos próximos 60 segundos?', 
        asset: 'Ethereum',
        currentPrice: '$2,545.80',
        upOdds: 1.65,
        downOdds: 1.65
      },
      { 
        id: 6, 
        question: 'A Solana vai subir nos próximos 60 segundos?', 
        asset: 'Solana',
        currentPrice: '$98.75',
        upOdds: 1.65,
        downOdds: 1.65
      }
    ],
    forex: [
      { 
        id: 7, 
        question: 'O USD/BRL vai subir nos próximos 60 segundos?', 
        asset: 'USD/BRL',
        currentPrice: 'R$ 5.12',
        upOdds: 1.65,
        downOdds: 1.65
      },
      { 
        id: 8, 
        question: 'O EUR/USD vai descer nos próximos 60 segundos?', 
        asset: 'EUR/USD',
        currentPrice: '$1.08',
        upOdds: 1.65,
        downOdds: 1.65
      },
      { 
        id: 9, 
        question: 'O GBP/USD vai subir nos próximos 60 segundos?', 
        asset: 'GBP/USD',
        currentPrice: '$1.26',
        upOdds: 1.65,
        downOdds: 1.65
      },
      { 
        id: 13, 
        question: 'O AUD/USD vai subir nos próximos 60 segundos?', 
        asset: 'AUD/USD',
        currentPrice: '$0.67',
        upOdds: 1.65,
        downOdds: 1.65
      },
      { 
        id: 14, 
        question: 'O USD/JPY vai descer nos próximos 60 segundos?', 
        asset: 'USD/JPY',
        currentPrice: '¥148.50',
        upOdds: 1.65,
        downOdds: 1.65
      }
    ],
    stocks: [
      { 
        id: 10, 
        question: 'A Apple vai subir nos próximos 60 segundos?', 
        asset: 'AAPL',
        currentPrice: '$185.40',
        upOdds: 1.65,
        downOdds: 1.65
      },
      { 
        id: 11, 
        question: 'A Microsoft vai descer nos próximos 60 segundos?', 
        asset: 'MSFT',
        currentPrice: '$375.20',
        upOdds: 1.65,
        downOdds: 1.65
      },
      { 
        id: 12, 
        question: 'A Tesla vai subir nos próximos 60 segundos?', 
        asset: 'TSLA',
        currentPrice: '$248.85',
        upOdds: 1.65,
        downOdds: 1.65
      },
      { 
        id: 15, 
        question: 'A Google vai subir nos próximos 60 segundos?', 
        asset: 'GOOGL',
        currentPrice: '$142.50',
        upOdds: 1.65,
        downOdds: 1.65
      },
      { 
        id: 16, 
        question: 'A Amazon vai descer nos próximos 60 segundos?', 
        asset: 'AMZN',
        currentPrice: '$155.80',
        upOdds: 1.65,
        downOdds: 1.65
      }
    ]
  };

  const currentPools = pools[selectedCategory as keyof typeof pools] || pools.commodities;

  // Process results when countdown ends
  const processResults = async () => {
    try {
      const fastBets = JSON.parse(localStorage.getItem('fastBets') || '[]');
      const currentRoundBets = fastBets.filter((bet: any) => bet.roundNumber === currentRound - 1);
      
      if (currentRoundBets.length === 0) return;

      // MVP Logic: Random results for each pool individually
      const poolResults: {[poolId: number]: string} = {};
      const uniquePools = [...new Set(currentRoundBets.map((bet: any) => bet.poolId))];
      
      uniquePools.forEach((poolId: number) => {
        poolResults[poolId] = Math.random() > 0.5 ? 'sim' : 'nao';
      });
      
      let totalUserWinnings = 0;
      
      for (const bet of currentRoundBets) {
        const poolWinner = poolResults[bet.poolId];
        if (bet.side === poolWinner) {
          // Winner! Pay out the winnings
          const winAmount = Math.floor(bet.amount * bet.odds);
          
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('saldo_moeda')
            .eq('id', bet.userId)
            .single();
          
          if (currentProfile) {
            await supabase
              .from('profiles')
              .update({ 
                saldo_moeda: currentProfile.saldo_moeda + winAmount
              })
              .eq('id', bet.userId);
          }

          // Create winning transaction
          await supabase
            .from('wallet_transactions')
            .insert({
              id: `fast_win_${bet.poolId}_${bet.userId}_${Date.now()}`,
              user_id: bet.userId,
              tipo: 'credito',
              valor: winAmount,
              descricao: `Vitória Fast Market - Pool ${bet.poolId} (${poolWinner.toUpperCase()})`
            });
            
          // Track user winnings for animation
          if (bet.userId === user?.id) {
            totalUserWinnings += winAmount;
          }
        }
      }
      
      // Show winner balance animation for current user
      if (totalUserWinnings > 0) {
        setShowWinnerBalance({ amount: totalUserWinnings, show: true });
        setTimeout(() => {
          setShowWinnerBalance({ amount: 0, show: false });
        }, 3000);
      }
      
      // Remove processed bets
      const remainingBets = fastBets.filter((bet: any) => bet.roundNumber !== currentRound - 1);
      localStorage.setItem('fastBets', JSON.stringify(remainingBets));
      
      refetchProfile();
      
      toast({
        title: `Resultado Round #${currentRound - 1}`,
        description: `Resultados individuais por pool! ${Object.values(poolResults).length} pool(s) processado(s).`,
      });
    } catch (error) {
      console.error('Error processing results:', error);
    }
  };

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCurrentRound(r => r + 1);
          processResults(); // Process results when round ends
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentRound]);

  // Winner results for last second
  useEffect(() => {
    if (countdown === 1) {
      // Generate individual random results for each pool
      const results: {[poolId: number]: string} = {};
      currentPools.forEach(pool => {
        results[pool.id] = Math.random() > 0.5 ? 'sim' : 'nao';
      });
      setWinnerResults(results);
      
      setTimeout(() => {
        setWinnerResults({});
      }, 1000);
    }
  }, [countdown, currentRound, currentPools]);

  const placeBet = async (poolId: number, side: 'sim' | 'nao', odds: number) => {
    if (!user || !profile || betAmount <= 0) return;

    if (betAmount > profile.saldo_moeda) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem RZ suficiente para esta opinião.",
        variant: "destructive"
      });
      return;
    }

    // Add click animation
    setClickedPool({ id: poolId, side });
    setTimeout(() => setClickedPool(null), 200);

    try {
      // Calculate 5% fee
      const fee = Math.floor(betAmount * 0.05);
      const netAmount = betAmount - fee;
      
      // Deduct amount from user balance immediately
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ saldo_moeda: profile.saldo_moeda - betAmount })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // Create transaction record for the bet
      const transactionId = `fast_${poolId}_${user.id}_${Date.now()}`;
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          id: transactionId,
          user_id: user.id,
          tipo: 'debito',
          valor: betAmount,
          descricao: `Opinião Fast Market - Pool ${poolId} (${side.toUpperCase()})`
        });

      if (transactionError) throw transactionError;
      
      // Create fee transaction record
      const feeTransactionId = `fast_fee_${poolId}_${user.id}_${Date.now()}`;
      const { error: feeTransactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          id: feeTransactionId,
          user_id: user.id,
          tipo: 'taxa_fast',
          valor: fee,
          descricao: `Taxa Fast Market 5% - Pool ${poolId}`
        });

      if (feeTransactionError) throw feeTransactionError;

      // Store the bet (with net amount for winnings calculation)
      const betData = {
        poolId,
        side,
        amount: netAmount, // Use net amount for winnings calculation
        odds,
        userId: user.id,
        timestamp: Date.now(),
        roundNumber: currentRound
      };

      const fastBets = JSON.parse(localStorage.getItem('fastBets') || '[]');
      fastBets.push(betData);
      localStorage.setItem('fastBets', JSON.stringify(fastBets));

      toast({
        title: "Opinião registrada!",
        description: `Você opinou ${side.toUpperCase()} com ${betAmount} RZ (taxa 5%: ${fee} RZ).`,
      });

      refetchProfile();
    } catch (error) {
      console.error('Error placing fast bet:', error);
      toast({
        title: "Erro ao registrar opinião",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    return `${seconds.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#ff2389]/20 to-[#ff2389]/10 border border-[#ff2389]/30">
              <Zap className="h-8 w-8 text-[#ff2389]" />
            </div>
            <h1 className="text-4xl font-bold text-[#ff2389]">
              Fast Markets
            </h1>
            <div className="animate-pulse">
              <div className="w-3 h-3 rounded-full bg-[#ff2389]"></div>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Mercados de opinião ultrarrápidos - Pools a cada 60 segundos ⚡️
          </p>
          
          {/* Live Round Counter */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <Badge variant="destructive" className="bg-[#ff2389] text-white text-lg px-4 py-2">
              Round #{currentRound}
            </Badge>
            <div className="flex items-center gap-2 text-2xl font-mono font-bold">
              <Clock className="h-6 w-6 text-[#ff2389]" />
              <span className="text-white">{formatTime(countdown)}</span>
            </div>
          </div>
          
          {/* Winner Balance Animation in Header */}
          {user && showWinnerBalance.show && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <div className="relative">
                <Link to="/wallet">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-primary rounded-xl"
                  >
                    <Wallet className="w-4 h-4" />
                    {(profile?.saldo_moeda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RZ
                  </Button>
                </Link>
                
                {/* Winner Balance Animation */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#00ff90] text-black px-3 py-1 rounded-full text-sm font-bold animate-bounce z-50 shadow-lg">
                  +{showWinnerBalance.amount} RZ
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Selecione o Tema</h2>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {categories.map((category) => {
                let activeClasses = "data-[state=active]:text-white";
                if (category.id === 'commodities') {
                  activeClasses = "data-[state=active]:bg-[#ffd800] data-[state=active]:text-gray-800 dark:data-[state=active]:bg-[#ffd800] dark:data-[state=active]:text-gray-800 light:data-[state=active]:bg-[#FFDFEC] light:data-[state=active]:text-gray-800";
                } else if (category.id === 'crypto') {
                  activeClasses = "data-[state=active]:bg-[#FF6101] data-[state=active]:text-white dark:data-[state=active]:bg-[#FF6101] dark:data-[state=active]:text-white light:data-[state=active]:bg-[#FFDFEC] light:data-[state=active]:text-gray-800";
                } else if (category.id === 'stocks') {
                  activeClasses = "data-[state=active]:bg-[#00ff90] data-[state=active]:text-black dark:data-[state=active]:bg-[#00ff90] dark:data-[state=active]:text-black light:data-[state=active]:bg-[#FFDFEC] light:data-[state=active]:text-gray-800";
                } else {
                  activeClasses = "data-[state=active]:bg-[#ff2389] data-[state=active]:text-white dark:data-[state=active]:bg-[#ff2389] dark:data-[state=active]:text-white light:data-[state=active]:bg-[#FFDFEC] light:data-[state=active]:text-gray-800";
                }
                
                return (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className={activeClasses}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Live Pools Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-[#ff2389]/10 to-[#ff2389]/5 px-4 py-2 rounded-full border border-[#ff2389]/20 ${
            countdown <= 8 ? 'animate-pulse' : ''
          }`}>
            <div className={countdown <= 8 ? 'animate-pulse' : ''}>
              <div className={`w-2 h-2 rounded-full bg-[#ff2389] ${countdown <= 8 ? 'animate-pulse' : ''}`}></div>
            </div>
            <span className="text-sm font-medium text-[#ff2389] uppercase tracking-wide">
              AO VIVO - {currentPools.length} Pools Ativos
            </span>
            <div className={countdown <= 8 ? 'animate-pulse' : ''}>
              <div className={`w-2 h-2 rounded-full bg-[#ff2389] ${countdown <= 8 ? 'animate-pulse' : ''}`}></div>
            </div>
          </div>
          
          {/* Countdown bar */}
          <div className="w-full max-w-md mx-auto mt-4">
            <div className={`h-2 bg-muted rounded-full overflow-hidden ${
              countdown <= 8 ? `animate-pulse` : ''
            }`}>
              <div 
                className={`h-full bg-gradient-to-r from-[#ff2389] to-[#ff2389]/80 transition-all duration-1000 ${
                  countdown <= 8 ? 'animate-[pulse_0.5s_ease-in-out_infinite]' : ''
                }`}
                style={{ width: `${(countdown / 60) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Pools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentPools.map((pool) => (
            <Card 
              key={pool.id} 
              className={`
                group transition-all duration-500 hover:scale-[1.02] cursor-pointer relative
                bg-gradient-to-br from-card/95 to-card/80 
                border border-border/50 hover:border-primary/30
                backdrop-blur-sm
                ${countdown <= 8 ? 'animate-pulse border-[#ff2389]/50' : ''}
                ${resolvedTheme === 'light' ? 'border-2' : ''}
                ${countdown === 1 && winnerResults[pool.id] ? 
                  (winnerResults[pool.id] === 'sim' ? 'bg-[#00ff90]/90' : 'bg-[#ff2389]/90')
                  : ''
                }
              `}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge 
                      variant="secondary" 
                      className={`mb-2 ${
                        selectedCategory === 'commodities' ? 'bg-[#ffd800]/20 text-[#ffd800] border-[#ffd800]/50' :
                        selectedCategory === 'crypto' ? 'bg-[#FF6101]/20 text-[#FF6101] border-[#FF6101]/50' :
                        selectedCategory === 'stocks' ? 'bg-[#00ff90]/20 text-[#00ff90] border-[#00ff90]/50' :
                        'bg-[#ff2389]/20 text-[#ff2389] border-[#ff2389]/50'
                      }`}
                    >
                      {pool.asset}
                    </Badge>
                    <CardTitle className="text-lg leading-tight">{pool.question}</CardTitle>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm text-muted-foreground">Preço Atual</div>
                    <div className="font-mono font-bold text-primary">{pool.currentPrice}</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => placeBet(pool.id, 'sim', getOdds(pool.upOdds))}
                    disabled={!user || countdown <= 5}
                    className={`
                      h-14 flex flex-col gap-1 bg-[#00ff90] text-black hover:bg-[#00ff90]/90 
                      border-2 border-[#00ff90] hover:border-[#00ff90]/70
                      transition-all duration-200 
                      ${countdown <= 5 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                      ${clickedPool?.id === pool.id && clickedPool?.side === 'sim' ? 'animate-pulse scale-95' : ''}
                    `}
                  >
                    <div className="font-bold text-lg">SIM</div>
                    <div className="text-sm font-mono">{getOdds(pool.upOdds).toFixed(2)}x</div>
                  </Button>
                  
                  <Button
                    onClick={() => placeBet(pool.id, 'nao', getOdds(pool.downOdds))}
                    disabled={!user || countdown <= 5}
                    className={`
                      h-14 flex flex-col gap-1 bg-[#ff2389] text-white hover:bg-[#ff2389]/90
                      border-2 border-[#ff2389] hover:border-[#ff2389]/70
                      transition-all duration-200 
                      ${countdown <= 5 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                      ${clickedPool?.id === pool.id && clickedPool?.side === 'nao' ? 'animate-pulse scale-95' : ''}
                    `}
                  >
                    <div className="font-bold text-lg">NÃO</div>
                    <div className="text-sm font-mono">{getOdds(pool.downOdds).toFixed(2)}x</div>
                  </Button>
                </div>

                {/* Countdown bar */}
                <div className="mt-4">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className={cn(
                        "bg-[#ff2389] h-1.5 rounded-full transition-all duration-1000",
                        countdown <= 8 && "animate-pulse"
                      )}
                      style={{ 
                        width: `${(countdown / 60) * 100}%`,
                        animationDuration: countdown <= 8 ? `${Math.max(0.1, countdown * 0.1)}s` : '2s'
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                    <span>Encerra em</span>
                    <span className="font-mono font-bold text-white">{formatTime(countdown)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quantity Selector - Moved to bottom */}
        {user && (
          <div className="max-w-lg mx-auto mt-8">
            <Card className="border border-[#ff2389]/20 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Quantidade</span>
                  <span className="text-sm font-bold text-primary">{(profile?.saldo_moeda || 0).toLocaleString()} RZ</span>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="range"
                    min="2"
                    max="1000"
                    value={Math.min(betAmount, Math.min(1000, profile?.saldo_moeda || 0))}
                    onChange={(e) => setBetAmount(Math.min(parseInt(e.target.value), profile?.saldo_moeda || 0))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, #00ff90 0%, #00ff90 ${(betAmount / Math.min(1000, profile?.saldo_moeda || 1000)) * 100}%, hsl(var(--muted)) ${(betAmount / Math.min(1000, profile?.saldo_moeda || 1000)) * 100}%, hsl(var(--muted)) 100%)`
                    }}
                  />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>2 RZ</span>
                    <div className="text-center">
                      <span className="text-lg font-bold text-primary">{betAmount} RZ</span>
                    </div>
                    <span>1.000 RZ</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <style>{`
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #00ff90;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 0 10px rgba(0, 255, 144, 0.5);
          }
          
          .slider-thumb::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #00ff90;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 0 10px rgba(0, 255, 144, 0.5);
          }
        `}</style>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-[#ff2389]/5 to-transparent border border-[#ff2389]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-[#ff2389]" />
                <h3 className="text-lg font-semibold text-[#ff2389]">Como Funciona</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Cada pool dura exatamente 60 segundos</p>
                <p>• Opine se o preço vai subir (⬆️) ou descer (⬇️)</p>
                <p>• Resultados individuais aleatórios para cada pool (MVP)</p>
                <p>• Novos pools começam automaticamente a cada minuto</p>
                <p>• Os odds diminuem conforme o tempo passa</p>
                <p>• Taxa de 5% cobrada por cada opinião</p>
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
    </div>
  );
};

export default Fast;