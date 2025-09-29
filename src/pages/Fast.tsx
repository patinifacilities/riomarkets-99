import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Zap, Clock, BarChart3 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { FastBetSelector, useFastBetting } from '@/components/markets/FastBetSelector';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Fast = () => {
  const [countdown, setCountdown] = useState(60);
  const [currentRound, setCurrentRound] = useState(1);
  const [betAmount, setBetAmount] = useState(100);
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { toast } = useToast();
  
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
      }
    ]
  };

  // Process results when countdown ends
  const processResults = async () => {
    try {
      const fastBets = JSON.parse(localStorage.getItem('fastBets') || '[]');
      const currentRoundBets = fastBets.filter((bet: any) => bet.roundNumber === currentRound - 1);
      
      if (currentRoundBets.length === 0) return;

      // MVP Logic: Alternate between "sim" and "não" results
      const winningOption = currentRound % 2 === 0 ? 'sim' : 'nao';
      
      for (const bet of currentRoundBets) {
        if (bet.side === winningOption) {
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
              descricao: `Vitória Fast Market - Pool ${bet.poolId} (${bet.side.toUpperCase()})`
            });
        }
      }
      
      // Remove processed bets
      const remainingBets = fastBets.filter((bet: any) => bet.roundNumber !== currentRound - 1);
      localStorage.setItem('fastBets', JSON.stringify(remainingBets));
      
      refetchProfile();
      
      toast({
        title: `Resultado Round #${currentRound - 1}`,
        description: `Vencedor: ${winningOption.toUpperCase()}! ${currentRoundBets.filter((b: any) => b.side === winningOption).length} opinião(ões) premiada(s).`,
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

    try {
      // Deduct amount from user balance immediately
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ saldo_moeda: profile.saldo_moeda - betAmount })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // Create transaction record
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

      // Store the bet
      const betData = {
        poolId,
        side,
        amount: betAmount,
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
        description: `Você opinou ${side.toUpperCase()} com ${betAmount} RZ.`,
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

  const currentPools = pools[selectedCategory as keyof typeof pools] || pools.commodities;

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
            <div className="flex items-center gap-2 text-2xl font-mono font-bold text-[#ff2389]">
              <Clock className="h-6 w-6" />
              {formatTime(countdown)}
            </div>
          </div>
        </div>

        {/* Category Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Selecione o Tema</h2>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {categories.map((category) => {
                let activeClasses = "data-[state=active]:text-white";
                if (category.id === 'commodities') {
                  activeClasses = "data-[state=active]:bg-[#ffd800] data-[state=active]:text-gray-800";
                } else if (category.id === 'crypto') {
                  activeClasses = "data-[state=active]:bg-[#FF6101] data-[state=active]:text-white";
                } else if (category.id === 'stocks') {
                  activeClasses = "data-[state=active]:bg-[#00ff90] data-[state=active]:text-black";
                } else {
                  activeClasses = "data-[state=active]:bg-[#ff2389] data-[state=active]:text-white";
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
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff2389]/10 to-[#ff2389]/5 px-4 py-2 rounded-full border border-[#ff2389]/20">
            <div className="animate-pulse">
              <div className="w-2 h-2 rounded-full bg-[#ff2389]"></div>
            </div>
            <span className="text-sm font-medium text-[#ff2389] uppercase tracking-wide">
              AO VIVO - {currentPools.length} Pools Ativos
            </span>
            <div className="animate-pulse">
              <div className="w-2 h-2 rounded-full bg-[#ff2389]"></div>
            </div>
          </div>
        </div>

        {/* Bet Amount Selector */}
        {user && (
          <div className="max-w-md mx-auto mb-8">
            <Card className="border border-[#ff2389]/20 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-center flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff2389] animate-pulse"></div>
                  Seletor de Valor - {(profile?.saldo_moeda || 0).toLocaleString()} RZ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, Math.min(parseInt(e.target.value) || 0, profile?.saldo_moeda || 0)))}
                    min="1"
                    max={profile?.saldo_moeda || 0}
                    className="flex-1 bg-background border border-border rounded px-3 py-2 text-center font-mono text-lg"
                    placeholder="Valor"
                  />
                  <span className="text-sm text-muted-foreground">RZ</span>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 100, 200].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount(Math.min(amount, profile?.saldo_moeda || 0))}
                      className="text-xs"
                      disabled={amount > (profile?.saldo_moeda || 0)}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>

                <div className="text-center pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Clique em SIM ou NÃO nos pools para opinar com este valor
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fast Pools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPools.map((pool) => (
            <Card 
              key={pool.id} 
              className="border border-[#ff2389]/20 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm hover:border-[#ff2389]/40 transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs border-[#ff2389]/50 text-[#ff2389]">
                    <Zap className="h-3 w-3 mr-1" />
                    60s
                  </Badge>
                  <div className="text-xs text-muted-foreground font-mono">
                    #{pool.id}
                  </div>
                </div>
                <CardTitle className="text-sm leading-tight">
                  {pool.question}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BarChart3 className="h-3 w-3" />
                  <span>{pool.asset}</span>
                  <span className="font-mono">{pool.currentPrice}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    className="bg-success hover:bg-success/90 text-black font-medium h-20 flex flex-col gap-1 text-sm"
                    onClick={() => {
                      if (user) {
                        placeBet(pool.id, 'sim', getOdds(pool.upOdds));
                      }
                    }}
                    disabled={!user || countdown <= 5}
                  >
                    <TrendingUp className="h-5 w-5" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm">⬆️ SIM</span>
                      <span className="text-sm font-bold transition-all duration-300">
                        {getOdds(pool.upOdds).toFixed(2)}x
                      </span>
                    </div>
                    {user && (
                      <div className="text-xs opacity-75">
                        {betAmount} RZ
                      </div>
                    )}
                  </Button>
                  <Button 
                    className="bg-[#ff2389] hover:bg-[#ff2389]/90 text-white font-medium h-20 flex flex-col gap-1 text-sm"
                    onClick={() => {
                      if (user) {
                        placeBet(pool.id, 'nao', getOdds(pool.downOdds));
                      }
                    }}
                    disabled={!user || countdown <= 5}
                  >
                    <TrendingDown className="h-5 w-5" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm">⬇️ NÃO</span>
                      <span className="text-sm font-bold transition-all duration-300">
                        {getOdds(pool.downOdds).toFixed(2)}x
                      </span>
                    </div>
                    {user && (
                      <div className="text-xs opacity-75">
                        {betAmount} RZ
                      </div>
                    )}
                  </Button>
                </div>
                
                {!user && (
                  <div className="text-center mt-3">
                    <p className="text-xs text-muted-foreground">
                      Faça login para opinar nos Fast Markets
                    </p>
                  </div>
                )}
                
                {/* Progress bar for time remaining */}
                <div className="mt-4">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={cn(
                        "bg-[#ff2389] h-2 rounded-full transition-all duration-1000",
                        countdown <= 8 && "animate-pulse"
                      )}
                      style={{ 
                        width: `${(countdown / 60) * 100}%`,
                        animationDuration: countdown <= 8 ? `${Math.max(0.1, countdown * 0.1)}s` : '2s'
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
                <p>• Resultados alternam entre SIM e NÃO a cada round</p>
                <p>• Novos pools começam automaticamente a cada minuto</p>
                <p>• Os odds diminuem conforme o tempo passa</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Fast;