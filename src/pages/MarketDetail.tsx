import { useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, TrendingUp, Clock, Wallet, Calculator } from 'lucide-react';
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
import { useState } from 'react';
import { Link } from 'react-router-dom';
import BetModal from '@/components/markets/BetModal';
import PoolProgressBar from '@/components/markets/PoolProgressBar';
import ProbabilityChart from '@/components/markets/ProbabilityChart';
import { RewardCalculatorModal } from '@/components/calculator/RewardCalculatorModal';
import SimpleOrderBook from '@/components/markets/SimpleOrderBook';
import { BetSlider } from '@/components/markets/BetSlider';

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: market, isLoading, refetch: refetchMarket } = useMarket(id || '');
  const { data: pool } = useMarketPool(id || '');
  const { toast } = useToast();
  const { openCalculator } = useRewardCalculator();
  
  // Get real authenticated user
  const { user: authUser } = useAuth();
  const { data: userProfile } = useProfile(authUser?.id);
  
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [betAmount, setBetAmount] = useState<number>(0);
  const [showBetModal, setShowBetModal] = useState(false);

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

  const handleSimulateReward = () => {
    // Calculate market probability from pool percentages
    const pMkt = pool?.percent_sim ? pool.percent_sim / 100 : null;
    
    openCalculator({
      marketId: market.id,
      suggestedValue: 100, // Default suggested value
      pMkt: pMkt,
    });
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

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6" aria-label="Voltar aos mercados">
          <ArrowLeft className="w-4 h-4" />
          Voltar aos mercados
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Header */}
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
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
                      {daysLeft > 0 ? `${daysLeft} dias` : 'Encerrando'}
                    </div>
                    <Badge className={getStatusColor(market.status)}>
                      {market.status}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-lg leading-relaxed mb-4 max-w-[65ch] mx-auto">
                  {market.descricao}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Criado: {new Date(market.created_at).toLocaleDateString('pt-BR')}
                  </div>
                   <div className="flex items-center gap-1">
                     <Users className="w-4 h-4" />
                     {(pool?.total_pool || 0).toLocaleString()} Rioz Coin total
                   </div>
                   <div className="flex items-center gap-1">
                     <TrendingUp className="w-4 h-4" />
                     {Math.max(100, (pool?.total_pool || 0) * 2).toLocaleString()} análises
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* Pool Progress Bar */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Odds do Mercado</h3>
              <PoolProgressBar 
                simPercent={pool?.percent_sim || 0} 
                naoPercent={pool?.percent_nao || 0}
                showOdds={true}
                simOdds={market.odds?.sim || 1.5}
                naoOdds={market.odds?.não || market.odds?.nao || 1.5}
              />
            </div>

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
                    onClick={() => handleOpenBetModal(opcao)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`text-2xl font-bold mb-2 ${getColorClass()}`}>
                        {opcao.toUpperCase()}
                      </div>
                      <div className="text-3xl font-extrabold mb-2">
                        {recompensa.toFixed(2)}x recompensa
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Recompensa para cada Rioz Coin
                      </div>
                      <Button 
                        className={`mt-4 w-full min-h-[44px] ${getButtonClass()}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBetModal(opcao);
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

            {/* Order Book */}
            <SimpleOrderBook 
              marketId={market.id}
              simPercent={pool?.percent_sim || 0}
              naoPercent={pool?.percent_nao || 0}
              simOdds={market.odds?.sim || 1.5}
              naoOdds={market.odds?.não || market.odds?.nao || 1.5}
            />
          </div>

          {/* User Info Panel */}
          <div className="sticky top-24">
            <Card className="bg-gradient-card border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Sua Carteira
                </h3>
                
                 <div className="space-y-4">
                    <BetSlider 
                      balance={userProfile?.saldo_moeda || 0}
                      onAmountChange={(amount) => setBetAmount(amount)}
                      estimatedReward={(betAmount || 1) * (selectedOption === 'sim' ? (market.odds?.sim || 1.5) : (market.odds?.não || market.odds?.nao || 1.5))}
                    />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => handleOpenBetModal('sim')}
                      disabled={market.status !== 'aberto'}
                      className="bg-[#00FF91] hover:bg-[#00FF91]/90 text-black shadow-[#00FF91]/20 min-h-[44px]"
                      size="sm"
                      aria-label="Opinar SIM"
                    >
                      Opinar SIM
                    </Button>
                    <Button 
                      onClick={() => handleOpenBetModal('não')}
                      disabled={market.status !== 'aberto'}
                      className="bg-[#FF1493] hover:bg-[#FF1493]/90 text-white shadow-[#FF1493]/20 min-h-[44px]"
                      size="sm"
                      aria-label="Opinar NÃO"
                    >
                      Opinar NÃO
                    </Button>
                  </div>

                   {/* Calculator button */}
                   <Button
                     variant="outline"
                     onClick={handleSimulateReward}
                     className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/10 min-h-[44px] rounded-xl"
                     aria-label="Simular recompensas"
                   >
                     <Calculator className="w-4 h-4" />
                     Simular recompensas
                   </Button>

                  {market.status !== 'aberto' && (
                    <div className="text-center text-sm text-muted-foreground">
                      Este mercado está {market.status}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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