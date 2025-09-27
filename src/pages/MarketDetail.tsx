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
import { useRewardCalculator } from '@/store/useRewardCalculator';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import BetModal from '@/components/markets/BetModal';
import PoolProgressBar from '@/components/markets/PoolProgressBar';

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: market, isLoading, refetch: refetchMarket } = useMarket(id || '');
  const { data: pool } = useMarketPool(id || '');
  const { toast } = useToast();
  const { openCalculator } = useRewardCalculator();
  
  // Mock user ID - replace with real auth later
  const mockUserId = "550e8400-e29b-41d4-a716-446655440000";
  const { data: user } = useUser(mockUserId);
  
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [betAmount, setBetAmount] = useState<string>('');
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
    setBetAmount('');
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
                </div>
              </CardContent>
            </Card>

            {/* Pool Progress Bar */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Distribuição das Análises</h3>
              <PoolProgressBar 
                simPercent={pool?.percent_sim || 0} 
                naoPercent={pool?.percent_nao || 0}
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {market.opcoes.map((opcao: string) => {
                const recompensa = market.recompensas[opcao] || 1.5;
                const isYes = opcao === 'sim';
                
                return (
                  <Card 
                    key={opcao}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:ring-1 hover:ring-primary ${
                      isYes ? 'hover:shadow-success' : 'hover:shadow-danger'
                    }`}
                    onClick={() => handleOpenBetModal(opcao)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`text-2xl font-bold mb-2 ${
                        isYes ? 'text-[#00FF91]' : 'text-[#FF1493]'
                      }`}>
                        {opcao.toUpperCase()}
                      </div>
                      <div className="text-3xl font-extrabold mb-2">
                        {recompensa.toFixed(2)}x recompensa
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Recompensa para cada Rioz Coin
                      </div>
                      <Button 
                        className={`mt-4 w-full min-h-[44px] ${
                          isYes 
                            ? 'bg-[#00FF91] hover:bg-[#00FF91]/90 text-black' 
                            : 'bg-[#FF1493] hover:bg-[#FF1493]/90 text-white'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBetModal(opcao);
                        }}
                        aria-label={`Analisar em ${opcao.toUpperCase()}`}
                      >
                        Analisar em {opcao.toUpperCase()}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Saldo disponível:</span>
                    <span className="font-semibold">{user?.saldo_moeda || 0} Rioz Coin</span>
                  </div>
                  
                  <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <div className="text-sm text-accent mb-1">Pool atual:</div>
                    <div className="text-xs space-y-1">
                      <div className="text-[#00FF91]">SIM: {pool?.pool_sim || 0} Rioz Coin ({pool?.percent_sim || 0}%)</div>
                      <div className="text-[#FF1493]">NÃO: {pool?.pool_nao || 0} Rioz Coin ({pool?.percent_nao || 0}%)</div>
                      <div className="text-muted-foreground">Total: {pool?.total_pool || 0} Rioz Coin</div>
                    </div>
                  </div>

                  <div className="p-3 bg-danger/10 rounded-lg border border-danger/20">
                    <div className="text-sm text-danger mb-1">Taxa de liquidação:</div>
                    <div className="text-xs text-muted-foreground">
                      20% do pool perdedor vai para a plataforma
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => handleOpenBetModal('sim')}
                      disabled={market.status !== 'aberto'}
                      className="bg-[#00FF91] hover:bg-[#00FF91]/90 text-black shadow-[#00FF91]/20 min-h-[44px]"
                      size="sm"
                      aria-label="Analisar SIM"
                    >
                      Analisar SIM
                    </Button>
                    <Button 
                      onClick={() => handleOpenBetModal('não')}
                      disabled={market.status !== 'aberto'}
                      className="bg-[#FF1493] hover:bg-[#FF1493]/90 text-white shadow-[#FF1493]/20 min-h-[44px]"
                      size="sm"
                      aria-label="Analisar NÃO"
                    >
                      Analisar NÃO
                    </Button>
                  </div>

                  {/* Calculator button */}
                  <Button
                    variant="outline"
                    onClick={handleSimulateReward}
                    className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/10 min-h-[44px]"
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
      {market && user && (
        <BetModal
          open={showBetModal}
          onOpenChange={setShowBetModal}
          market={market}
          selectedOption={selectedOption}
          userBalance={user.saldo_moeda}
          userId={mockUserId}
          recompensa={1} // Will be calculated by rewards system
          onBetSuccess={handleBetSuccess}
        />
      )}
    </div>
  );
};

export default MarketDetail;