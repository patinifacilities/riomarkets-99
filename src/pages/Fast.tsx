import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Zap, Clock, BarChart3 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { FastMarketTermsModal } from '@/components/fast/FastMarketTermsModal';
import { FastPoolHistoryModal } from '@/components/fast/FastPoolHistoryModal';
import { useFastPools, usePlaceFastBet, useProcessFastResults } from '@/hooks/useFastPools';

const Fast = () => {
  const [betAmount, setBetAmount] = useState(100);
  const [clickedPool, setClickedPool] = useState<{id: string, side: string} | null>(null);
  const [winnerResults, setWinnerResults] = useState<{[poolId: string]: string}>({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedPoolSymbol, setSelectedPoolSymbol] = useState<string | null>(null);
  const [poolHistoryOpen, setPoolHistoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('commodities');
  
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  
  // Use the new Fast pools system
  const { data: poolsData, isLoading: poolsLoading, error: poolsError } = useFastPools(selectedCategory);
  const placeFastBet = usePlaceFastBet();
  const processResults = useProcessFastResults();

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

  // Calculate dynamic odds based on countdown
  const getOdds = (baseOdds: number, secondsRemaining: number) => {
    const timeElapsed = 60 - secondsRemaining;
    if (timeElapsed >= 35) { // 25 seconds remaining
      return 1.0;
    }
    const reduction = (timeElapsed / 35) * (baseOdds - 1.0);
    return Math.max(1.0, baseOdds - reduction);
  };

  // Categories/themes for the fast pools
  const categories = [
    { id: 'crypto', name: 'Cripto', icon: '₿' },
    { id: 'commodities', name: window.innerWidth < 768 ? 'Commod' : 'Commodities', icon: '🛢️' },
    { id: 'forex', name: 'Forex', icon: '💱' },
    { id: 'stocks', name: 'Ações', icon: '📈' }
  ];

  // Get current round data
  const currentRound = poolsData?.current_round || 1;
  const secondsRemaining = poolsData?.seconds_remaining || 60;
  const currentPools = poolsData?.pools || [];

  // Format currency for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const placeBet = async (poolId: string, side: 'subiu' | 'desceu', odds: number) => {
    if (!user || !profile || betAmount < 0.1) {
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para opinar é 0.1 RZ.",
        variant: "destructive"
      });
      return;
    }

    // Block bets when 10 seconds or less remaining
    if (secondsRemaining <= 10) {
      toast({
        title: "Pool fechado",
        description: "Não é possível enviar ordens nos últimos 10 segundos.",
        variant: "destructive"
      });
      return;
    }

    if (betAmount > profile.saldo_moeda) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem RZ suficiente para esta opinião.",
        variant: "destructive"
      });
      return;
    }

    // Enhanced animation feedback
    setClickedPool({ id: poolId, side });
    setTimeout(() => setClickedPool(null), 300);

    try {
      await placeFastBet.mutateAsync({
        pool_id: poolId,
        side,
        amount_rioz: betAmount,
        odds
      });

      toast({
        title: "Ordem enviada!",
        description: `Opinião ${side.toUpperCase()} registrada com ${betAmount} RZ.`,
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
              <span className="text-white">{formatTime(secondsRemaining)}</span>
            </div>
          </div>
          
          {/* Continuous Progress Bar */}
          <div className="w-full max-w-md mx-auto mt-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#ff2389] to-[#ff2389]/80 transition-all duration-1000 ease-linear"
                style={{ width: `${(secondsRemaining / 60) * 100}%` }}
              />
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
                  activeClasses = "data-[state=active]:bg-[#ffd800] data-[state=active]:text-gray-800 dark:data-[state=active]:bg-[#ffd800] dark:data-[state=active]:text-gray-800 light:data-[state=active]:bg-[#FFDFEC] light:data-[state=active]:text-gray-800";
                } else if (category.id === 'crypto') {
                  activeClasses = "data-[state=active]:bg-[#FF6101] data-[state=active]:text-white dark:data-[state=active]:bg-[#FF6101] dark:data-[state=active]:text-white light:data-[state=active]:bg-[#FFDFEC] light:data-[state=active]:text-gray-800";
                } else if (category.id === 'stocks') {
                  activeClasses = "data-[state=active]:bg-[#1E40AF] data-[state=active]:text-white dark:data-[state=active]:bg-[#1E40AF] dark:data-[state=active]:text-white light:data-[state=active]:bg-[#FFDFEC] light:data-[state=active]:text-gray-800";
                } else if (category.id === 'forex') {
                  activeClasses = "data-[state=active]:bg-[#059669] data-[state=active]:text-white dark:data-[state=active]:bg-[#059669] dark:data-[state=active]:text-white light:data-[state=active]:bg-[#FFDFEC] light:data-[state=active]:text-gray-800";
                }
                
                return (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id} 
                    className={cn("text-sm", activeClasses)}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Live Pools */}
        {poolsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-secondary-glass rounded-lg animate-pulse" />
            ))}
          </div>
        ) : poolsError ? (
          <div className="text-center py-8">
            <p className="text-red-500">Erro ao carregar pools: {poolsError.message}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentPools.map((pool) => {
              const poolWinner = winnerResults[pool.id];
              const hasResult = !!poolWinner;
              
              return (
                <Card 
                  key={pool.id} 
                  className={cn(
                    "relative overflow-hidden border-2 transition-all duration-6750 ease-in-out group cursor-pointer bg-gradient-to-br",
                    hasResult ? (
                      poolWinner === 'manteve' 
                        ? "from-[#ffd800] to-[#ffd800]/80 border-[#ffd800]/50" 
                        : poolWinner === 'subiu' 
                          ? "from-[#00ff90] to-[#00ff90]/80 border-[#00ff90]/50" 
                          : "from-[#ff2389] to-[#ff2389]/80 border-[#ff2389]/50"
                    ) : (
                      resolvedTheme === 'light' 
                        ? "from-gray-50 to-white border-gray-200 hover:border-primary/30" 
                        : "from-card/80 to-card border-border hover:border-primary/30"
                    )
                  )}
                  onClick={() => {
                    setSelectedPoolSymbol(pool.asset_symbol);
                    setPoolHistoryOpen(true);
                  }}
                >
                  {hasResult && poolWinner !== 'manteve' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className={cn(
                          "text-lg font-bold mb-2 leading-tight",
                          hasResult 
                            ? (poolWinner === 'manteve' ? "text-gray-800" : "text-white")
                            : "text-foreground"
                        )}>
                          {pool.question}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs",
                              hasResult 
                                ? (poolWinner === 'manteve' ? "bg-gray-700 text-white" : "bg-black/20 text-white")
                                : ""
                            )}
                          >
                            {pool.asset_name}
                          </Badge>
                          <span className={cn(
                            "text-sm font-medium",
                            hasResult 
                              ? (poolWinner === 'manteve' ? "text-gray-700" : "text-white/90")
                              : "text-muted-foreground"
                          )}>
                            {formatPrice(pool.opening_price)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <BarChart3 className={cn(
                          "h-5 w-5",
                          hasResult 
                            ? (poolWinner === 'manteve' ? "text-gray-600" : "text-white/80")
                            : "text-muted-foreground"
                        )} />
                        {hasResult && (
                          <Badge className={cn(
                            "text-xs font-bold",
                            poolWinner === 'manteve' 
                              ? "bg-gray-700 text-white" 
                              : poolWinner === 'subiu' 
                                ? "bg-[#00ff90] text-black" 
                                : "bg-[#ff2389] text-white"
                          )}>
                            {poolWinner === 'subiu' ? 'SUBIU' : poolWinner === 'desceu' ? 'DESCEU' : 'MANTEVE'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          placeBet(pool.id, 'subiu', getOdds(pool.base_odds, secondsRemaining));
                        }}
                        disabled={secondsRemaining <= 10 || hasResult}
                        className={cn(
                          "h-12 font-semibold text-base transition-all duration-300",
                          clickedPool?.id === pool.id && clickedPool?.side === 'subiu' 
                            ? 'scale-[1.02] shadow-lg shadow-[#00ff90]/30 ring-2 ring-[#00ff90]/50' 
                            : '',
                          hasResult && poolWinner === 'subiu' 
                            ? "bg-[#00ff90] text-black border-2 border-white"
                            : hasResult 
                              ? "bg-gray-500 text-gray-300 opacity-60"
                              : "bg-[#00ff90] hover:bg-[#00ff90]/90 text-black"
                        )}
                      >
                        <div className="flex flex-col items-center">
                          <TrendingUp className="h-4 w-4 mb-1" />
                          <span>SIM</span>
                          <span className="text-xs opacity-75">
                            {getOdds(pool.base_odds, secondsRemaining).toFixed(2)}x
                          </span>
                        </div>
                      </Button>
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          placeBet(pool.id, 'desceu', getOdds(pool.base_odds, secondsRemaining));
                        }}
                        disabled={secondsRemaining <= 10 || hasResult}
                        className={cn(
                          "h-12 font-semibold text-base transition-all duration-300",
                          clickedPool?.id === pool.id && clickedPool?.side === 'desceu' 
                            ? 'scale-[1.02] shadow-lg shadow-[#ff2389]/30 ring-2 ring-[#ff2389]/50' 
                            : '',
                          hasResult && poolWinner === 'desceu' 
                            ? "bg-[#ff2389] text-white border-2 border-white"
                            : hasResult 
                              ? "bg-gray-500 text-gray-300 opacity-60"
                              : "bg-[#ff2389] hover:bg-[#ff2389]/90 text-white"
                        )}
                      >
                        <div className="flex flex-col items-center">
                          <TrendingDown className="h-4 w-4 mb-1" />
                          <span>NÃO</span>
                          <span className="text-xs opacity-75">
                            {getOdds(pool.base_odds, secondsRemaining).toFixed(2)}x
                          </span>
                        </div>
                      </Button>
                    </div>
                    
                    <div className={cn(
                      "text-center pt-2 border-t",
                      hasResult 
                        ? (poolWinner === 'manteve' ? "border-gray-600" : "border-white/20")
                        : "border-border"
                    )}>
                      <p className={cn(
                        "text-sm",
                        hasResult 
                          ? (poolWinner === 'manteve' ? "text-gray-600" : "text-white/80")
                          : "text-muted-foreground"
                      )}>
                        Clique no card para ver histórico
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Bet Amount Selector */}
        <div className="max-w-md mx-auto mb-8">
          <Card className="bg-secondary-glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-center">Valor da Opinião</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-2xl font-bold text-primary">{betAmount} RZ</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1000"
                  step="0.1"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.1 RZ</span>
                  <span>1000 RZ</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Terms Modal */}
        <FastMarketTermsModal
          open={showTermsModal}
          onOpenChange={setShowTermsModal}
        />

        {/* Pool History Modal */}
        <FastPoolHistoryModal
          open={poolHistoryOpen}
          onOpenChange={setPoolHistoryOpen}
          assetSymbol={selectedPoolSymbol || ""}
          timeLeft={secondsRemaining}
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          onPlaceBet={placeBet}
        />
      </div>
    </div>
  );
};

export default Fast;