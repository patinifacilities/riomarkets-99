import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, TrendingUp, Clock, Wallet, Calculator, LogIn, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMarket } from '@/hooks/useMarkets';
import { useMarketPool } from '@/hooks/useMarketPoolsNew';
import { useUser } from '@/hooks/useUsers';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useRewardCalculator } from '@/store/useRewardCalculator';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BetModal from '@/components/markets/BetModal';
import { supabase } from '@/integrations/supabase/client';
import PoolProgressBar from '@/components/markets/PoolProgressBar';
import ProbabilityChart from '@/components/markets/ProbabilityChart';
import { RewardCalculatorModal } from '@/components/calculator/RewardCalculatorModal';
import { OrderBookChart } from '@/components/markets/OrderBookChart';
import { BetSlider } from '@/components/markets/BetSlider';
import { SliderConfirm } from '@/components/ui/slider-confirm';
import { OpenOpinionsCard } from '@/components/markets/OpenOpinionsCard';
import { OpenOpinionsCardDetail } from '@/components/markets/OpenOpinionsCardDetail';
import { LivePriceChart } from '@/components/markets/LivePriceChart';

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: market, isLoading, refetch: refetchMarket } = useMarket(id || '');
  const { data: pool } = useMarketPool(id || '');
  const { toast } = useToast();
  const { openCalculator } = useRewardCalculator();
  
  // Get real authenticated user
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { data: userProfile } = useProfile(authUser?.id);
  
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [betAmount, setBetAmount] = useState<number>(0);
  const [showBetModal, setShowBetModal] = useState(false);
  const [sliderProgress, setSliderProgress] = useState<number>(0);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Reset gold animation after 1.5s when it reaches 100%
  useEffect(() => {
    if (sliderProgress >= 1) {
      const timer = setTimeout(() => {
        setSliderProgress(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [sliderProgress]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando mercado...</p>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Mercado não encontrado</h1>
        <p className="text-muted-foreground mb-8">O mercado que você está procurando não existe ou foi removido.</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Início
          </Button>
        </Link>
      </div>
    );
  }

  const getDaysUntilEnd = (endDate: string): number => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleOpenBetModal = (option: string) => {
    setSelectedOption(option);
    setShowBetModal(true);
  };

  const handleBetSuccess = () => {
    refetchMarket();
    setSelectedOption('');
    setBetAmount(0);
  };


  const daysLeft = getDaysUntilEnd(market.end_date);

  const getCategoryColor = (category: string) => {
    const colors = {
      'economia': 'bg-success-muted text-success',
      'esportes': 'bg-accent-muted text-accent',
      'política': 'bg-danger-muted text-danger',
      'clima': 'bg-primary-glow/20 text-primary'
    };
    return colors[category as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'aberto': 'bg-success-muted text-success',
      'fechado': 'bg-muted text-muted-foreground',
      'liquidado': 'bg-accent-muted text-accent'
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const scrollToWallet = () => {
    const walletSection = document.getElementById('wallet-section');
    if (walletSection) {
      walletSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      {/* Blocked User Warning */}
      {userProfile?.is_blocked && (
        <div className="bg-red-500 text-white px-4 py-3 text-center font-semibold">
          ⚠️ Sua conta está temporariamente bloqueada. Você não pode enviar opiniões no momento. Entre em contato com o suporte.
        </div>
      )}
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6" aria-label="Voltar aos mercados">
          <ArrowLeft className="w-4 h-4" />
          Voltar aos mercados
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Photo */}
            {market.photo_url && (
              <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden bg-muted">
                <img 
                  src={market.photo_url} 
                  alt={market.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Market Header */}
            <Card className="bg-gradient-card border-border/50 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/[0.03] before:to-transparent after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-tr after:from-transparent after:via-white/[0.02] after:to-white/[0.04]">
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <Badge className={getCategoryColor(market.categoria)}>
                      {market.categoria}
                    </Badge>
                    <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-tight [text-wrap:balance]">{market.titulo}</h1>
                  </div>
                  <div className="text-right space-y-2">
                     <div className="flex items-center gap-1 text-sm text-muted-foreground">
                       <Clock className="w-4 h-4" />
                       <span className="flex items-center gap-1">
                         <span className="mr-1">{daysLeft > 0 ? daysLeft : 0}</span>
                         <span>dias</span>
                       </span>
                     </div>
                    <Badge className={getStatusColor(market.status)}>
                      {market.status}
                    </Badge>
                  </div>
                </div>
                
                 <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  {market.descricao}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Criado: {new Date(market.created_at).toLocaleDateString('pt-BR')}
                  </div>
                   <div className="flex items-center gap-1">
                     <Users className="w-4 h-4" />
                     {(pool?.total_pool || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Rioz Coin total
                   </div>
                   <div className="flex items-center gap-1">
                     <TrendingUp className="w-4 h-4" />
                     {Math.min((pool?.total_pool || 0), Math.max(100, (pool?.total_pool || 0) * 2)).toLocaleString('pt-BR')} análises
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* User Info Panel - Mobile (positioned after market details) */}
            <div className="lg:hidden">
              <Card id="wallet-section" className="shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Sua Carteira
                  </h3>
                  
                   <div className="space-y-4">
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Saldo disponível</span>
                          <span className="text-lg font-bold text-primary">
                            {(userProfile?.saldo_moeda || 0).toLocaleString()} RIOZ
                          </span>
                        </div>
                      </div>
                      
                      {(userProfile?.saldo_moeda || 0) === 0 && (
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground mb-3">
                            Você precisa de Rioz Coin para opinar neste mercado
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate('/exchange')}
                            className="w-full"
                          >
                            Depositar R$ ou Trocar por RZ
                          </Button>
                        </div>
                      )}
                      
                      <div className="text-center text-sm text-muted-foreground">Use o slider para escolher o valor</div>
                      
                      <div className={!authUser || (userProfile?.saldo_moeda || 0) === 0 ? 'opacity-50 pointer-events-none' : ''}>
                        <BetSlider 
                          balance={userProfile?.saldo_moeda || 0}
                          onAmountChange={(amount) => setBetAmount(amount)}
                          estimatedReward={(betAmount || 1) * (selectedOption === 'sim' ? (market.odds?.sim || 1.5) : (market.odds?.não || market.odds?.nao || 1.5))}
                          key={userProfile?.saldo_moeda}
                        />
                      </div>
                    
                     {selectedOption && betAmount > 0 && (
                     <div className="mt-4 p-4 bg-secondary/20 rounded-lg border border-primary/20">
                       <div className="text-sm text-muted-foreground mb-2">Opção selecionada:</div>
                       <div className="text-lg font-semibold text-primary mb-2">{selectedOption.toUpperCase()}</div>
                       <div className="text-sm text-muted-foreground mb-1">Valor Opinado: {betAmount.toLocaleString()} Rioz</div>
                       <div className="text-sm text-muted-foreground mb-1">Retorno estimado: {((betAmount || 1) * (selectedOption === 'sim' ? (market.odds?.sim || 1.5) : (market.odds?.não || market.odds?.nao || 1.5))).toLocaleString()} Rioz</div>
                         <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-500/50 shadow-xl">
                           {/* Gold fill based on slider progress - resets at 100% after 1.5s */}
                           <div 
                             className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"
                             style={{
                               width: `${sliderProgress * 100}%`,
                               transition: 'none'
                             }}
                           />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent animate-shimmer"></div>
                          <div className="relative z-10 text-center">
                            <span 
                              className="text-xs font-semibold tracking-wide"
                              style={{
                                color: sliderProgress > 0.1 ? '#374151' : 'rgb(234, 179, 8, 0.8)',
                                transition: 'none'
                              }}
                            >
                              LUCRO ESTIMADO
                            </span>
                            <div 
                              className="text-2xl font-bold mt-1"
                              style={{
                                color: sliderProgress > 0.1 ? '#1f2937' : 'transparent',
                                backgroundImage: sliderProgress > 0.1 ? 'none' : 'linear-gradient(to right, rgb(250, 204, 21), rgb(234, 179, 8), rgb(202, 138, 4))',
                                backgroundClip: sliderProgress > 0.1 ? 'unset' : 'text',
                                WebkitBackgroundClip: sliderProgress > 0.1 ? 'unset' : 'text',
                                transition: 'none'
                              }}
                            >
                              +{(((betAmount || 1) * (selectedOption === 'sim' ? (market.odds?.sim || 1.5) : (market.odds?.não || market.odds?.nao || 1.5))) - (betAmount || 1)).toLocaleString()} Rioz
                            </div>
                          </div>
                        </div>
                     </div>
                    )}
                    
                     {(userProfile?.saldo_moeda || 0) === 0 ? (
                       <div className="p-4 bg-warning/10 border border-warning rounded-lg text-center">
                         <p className="text-sm text-warning mb-2">Saldo insuficiente para opinar</p>
                         <p className="text-xs text-muted-foreground">Deposite R$ ou troque R$ por RIOZ para começar a opinar</p>
                       </div>
                     ) : (
                       <div className="grid grid-cols-2 gap-2 mt-4">
                         <Button 
                           onClick={() => setSelectedOption('sim')}
                           disabled={market.status !== 'aberto'}
                           className={`min-h-[44px] ${selectedOption === 'sim' ? 'bg-[#00ff90] hover:bg-[#00ff90]/90 text-black font-semibold' : 'bg-[#00ff90] text-black border-2 hover:bg-[#00ff90]/90 font-semibold'}`}
                           size="sm"
                           aria-label="Opinar Sim"
                         >
                           <div className="flex items-center justify-between w-full">
                             <span>Opinar Sim</span>
                             <span className="text-xs opacity-80">{(market.odds?.sim || 1.5).toFixed(2)}x</span>
                           </div>
                         </Button>
                         <Button 
                           onClick={() => setSelectedOption('nao')}
                           disabled={market.status !== 'aberto'}
                           className={`min-h-[44px] ${selectedOption === 'nao' ? 'bg-[#ff2389] hover:bg-[#ff2389]/90 text-white font-semibold' : 'bg-[#ff2389] text-white border-2 hover:bg-[#ff2389]/90 font-semibold'}`}
                           size="sm"
                           aria-label="Opinar Não"
                         >
                           <div className="flex items-center justify-between w-full">
                             <span>Opinar Não</span>
                             <span className="text-xs opacity-80">{(market.odds?.não || market.odds?.nao || 1.5).toFixed(2)}x</span>
                           </div>
                         </Button>
                       </div>
                     )}
                     
                     {selectedOption && betAmount > 0 && (
                       <div className="w-full mt-4 block" data-confirm-area>
                         <SliderConfirm
                          selectedOption={selectedOption}
                          disabled={market.status !== 'aberto' || !selectedOption || betAmount <= 0}
                          onProgressChange={(progress) => setSliderProgress(progress)}
                            onConfirm={async () => {
                              if (!authUser?.id) {
                                toast({
                                  title: "Erro",
                                  description: "Você precisa estar logado para opinar",
                                  variant: "destructive",
                                });
                                return;
                              }

                            try {
                              const recompensa = market.odds?.[selectedOption] || 1.5;
                              
                              // Insert into market_order_book_pools for pool-specific orderbook
                              const { error: orderBookError } = await supabase
                                .from('market_order_book_pools')
                                .insert({
                                  market_id: market.id,
                                  user_id: authUser.id,
                                  side: selectedOption,
                                  quantity: betAmount,
                                  price: recompensa,
                                  status: 'filled',
                                  filled_at: new Date().toISOString()
                                });

                              if (orderBookError) throw orderBookError;

                                // Add shrink animation to confirmation area
                                const confirmArea = document.querySelector('[data-confirm-area]');
                                if (confirmArea) {
                                  confirmArea.classList.add('animate-scale-out');
                                  setTimeout(() => {
                                    setSelectedOption('');
                                    setBetAmount(0);
                                  }, 200);
                                } else {
                                  setSelectedOption('');
                                  setBetAmount(0);
                                }

                                toast({
                                  title: "✓ Opinião enviada com sucesso!",
                                 description: `Você opinou ${selectedOption.toUpperCase()} com ${betAmount} RIOZ`,
                                 className: "fixed bottom-24 md:bottom-4 right-4 rounded-2xl z-50 bg-[#00ff90] text-black border-[#00ff90]"
                                });

                             setSelectedOption('');
                             setBetAmount(0);
                             refetchMarket();

                           } catch (error) {
                             console.error('Error placing bet:', error);
                             toast({
                               title: "Erro ao registrar opinião",
                               description: "Tente novamente mais tarde",
                               variant: "destructive",
                             });
                           }
                           }}
                           text="Deslize para confirmar opinião"
                           className="w-full"
                         />
                        </div>
                      )}
                   </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Price Chart - Only for cripto category */}
            {market.categoria === 'cripto' && (
              <LivePriceChart 
                assetSymbol={market.id}
                assetName={market.titulo}
              />
            )}

            {/* Pool Progress Bar */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Opiniões order book</h3>
              <PoolProgressBar
                simPercent={pool?.percent_sim || 0} 
                naoPercent={pool?.percent_nao || 0}
                showOdds={true}
                simOdds={market.odds?.sim || 1.5}
                naoOdds={market.odds?.não || market.odds?.nao || 1.5}
              />
            </div>

            {/* Desktop: Open Opinions Card Detail was here, moved to sidebar */}

            {/* Pool Rules - Expandable */}
            {(market as any).rules && (
              <Card className="border-primary/20 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/[0.03] before:to-transparent after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-tr after:from-transparent after:via-white/[0.02] after:to-white/[0.04]">
                <CardContent className="p-0 relative z-10">
                  <button
                    onClick={() => setRulesExpanded(!rulesExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Regras do Pool</h3>
                    </div>
                    {rulesExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  {rulesExpanded && (
                    <div className="px-4 pb-4">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {(market as any).rules}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Probability Chart */}
            <ProbabilityChart 
              marketId={market.id}
              createdAt={market.created_at}
            />

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {market.opcoes.map((opcao: string, index: number) => {
                const recompensa = market.odds?.[opcao] || 1.5;
                const allRecompensas = market.opcoes.map(opt => market.odds?.[opt] || 1.5);
                const maxRecompensa = Math.max(...allRecompensas);
                const minRecompensa = Math.min(...allRecompensas);
                
                // Use colors based on odds values
                const isHighOdds = recompensa === maxRecompensa;
                const isLowOdds = recompensa === minRecompensa;
                
                const getColorClass = () => {
                  if (market.opcoes.length === 2) {
                    // Binary - use SIM/NÃO colors
                    const isYes = opcao === 'sim';
                    return isYes ? 'text-[#00FF91]' : 'text-[#FF1493]';
                  } else {
                    // Multiple options - use odds-based colors
                    if (isHighOdds) return 'text-[#ff2389]'; // Higher odds = red
                    if (isLowOdds) return 'text-[#00ff90]'; // Lower odds = green
                    return 'text-foreground'; // Neutral
                  }
                };
                
                const getButtonClass = () => {
                  if (market.opcoes.length === 2) {
                    // Binary - use SIM/NÃO colors
                    const isYes = opcao === 'sim';
                    return isYes 
                      ? 'bg-[#00FF91] hover:bg-[#00FF91]/90 text-black' 
                      : 'bg-[#FF1493] hover:bg-[#FF1493]/90 text-white';
                  } else {
                    // Multiple options - use odds-based colors
                    if (isHighOdds) return 'bg-[#ff2389] hover:bg-[#ff2389]/90 text-white';
                    if (isLowOdds) return 'bg-[#00ff90] hover:bg-[#00ff90]/90 text-black';
                    return 'bg-primary hover:bg-primary/90 text-primary-foreground';
                  }
                };
                
                 return (
                  <Card 
                    key={opcao}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:ring-1 ${
                      market.opcoes.length === 2 
                        ? (opcao === 'sim' 
                           ? 'hover:ring-primary hover:shadow-success' 
                           : 'hover:ring-[#ff2389] hover:shadow-danger hover:border-[#ff2389]')
                        : (isHighOdds 
                           ? 'hover:ring-[#ff2389] hover:shadow-danger hover:border-[#ff2389]'
                           : 'hover:ring-[#00ff90] hover:shadow-success hover:border-[#00ff90]')
                    }`}
                    onClick={() => {
                      setSelectedOption(opcao);
                      // On desktop, scroll to top; on mobile, scroll to wallet
                      if (window.innerWidth >= 1024) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        scrollToWallet();
                      }
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`text-2xl font-bold mb-2 ${getColorClass()}`}>
                        {opcao.toUpperCase()}
                      </div>
                      <div 
                        className="text-3xl font-extrabold mb-2 cursor-pointer"
                        onClick={scrollToWallet}
                      >
                        {recompensa.toFixed(2)}x recompensa
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Recompensa para cada Rioz Coin
                      </div>
                      <Button 
                        className={`mt-4 w-full min-h-[44px] ${getButtonClass()}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOption(opcao);
                          scrollToWallet();
                        }}
                        aria-label={`Opinar em ${opcao.toUpperCase()}`}
                      >
                        Opinar {opcao.toUpperCase()}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Mobile: Open Opinions Card - Last position, above footer */}
            <div className="lg:hidden mt-6">
              <OpenOpinionsCardDetail 
                marketId={market.id}
                onOrderCancelled={() => {
                  refetchMarket();
                }}
              />
            </div>

          </div>

            {/* User Info Panel - Desktop */}
          <div className="hidden lg:block space-y-6 sticky top-24">
            <Card id="wallet-section" className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Sua Carteira
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Saldo disponível</span>
                      <span className="text-lg font-bold text-primary">
                        {(userProfile?.saldo_moeda || 0).toLocaleString()} RIOZ
                      </span>
                    </div>
                  </div>
                  
                  {(userProfile?.saldo_moeda || 0) === 0 && (
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        Você precisa de Rioz Coin para opinar neste mercado
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/exchange')}
                        className="w-full"
                      >
                        Depositar R$ ou Trocar por RZ
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Desktop: Open Opinions Card Detail - Right after wallet */}
            <OpenOpinionsCardDetail 
              marketId={market.id}
              onOrderCancelled={() => {
                refetchMarket();
              }}
            />
           </div>
        </div>
      </div>

      {/* Bet Modal */}
      {market && userProfile && authUser && (
        <BetModal
          open={showBetModal}
          onOpenChange={setShowBetModal}
          market={market}
          selectedOption={selectedOption}
          userBalance={userProfile.saldo_moeda}
          userId={authUser.id}
          recompensa={market.odds?.[selectedOption] || 1.5}
          onBetSuccess={handleBetSuccess}
        />
      )}

      {/* Reward Calculator Modal */}
      <RewardCalculatorModal />
    </div>
  );
};

export default MarketDetail;