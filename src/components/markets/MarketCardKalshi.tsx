import React, { useState } from 'react';
import { Bookmark, Share2, Clock, Flame } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Market } from '@/types';
import BetModal from './BetModal';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useMarketPoolDetailed } from '@/hooks/useMarketPoolsDetailed';
import { useMarketRewards } from '@/hooks/useMarketRewards';
import { useMarketStats } from '@/hooks/useMarketStats';
import { useIsWatched, useToggleWatchlist } from '@/hooks/useWatchlist';
import { formatVolume, formatTimeLeft } from '@/lib/format';
import { getPlaceholderThumbnail } from '@/lib/market-utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MarketCardKalshiProps {
  market: Market;
  className?: string;
  showHotIcon?: boolean;
}

const MarketCardKalshi = React.memo(function MarketCardKalshi({ market, className, showHotIcon }: MarketCardKalshiProps) {
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('sim');
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const detailedPool = useMarketPoolDetailed(market);
  const { data: marketRewards } = useMarketRewards(market.id);
  const { data: stats } = useMarketStats(market.id);
  const isWatched = useIsWatched(market.id);
  const toggleWatchlist = useToggleWatchlist();
  const { toast } = useToast();

  const getCategoryDisplayName = (categoria: string) => {
    const displayNames: Record<string, string> = {
      'economia': 'Economia',
      'politica': 'Política', 
      'esportes': 'Esportes',
      'entretenimento': 'Entretenimento',
      'tecnologia': 'Tecnologia',
      'clima': 'Clima'
    };
    return displayNames[categoria] || categoria.charAt(0).toUpperCase() + categoria.slice(1);
  };

  const handleBetClick = (e: React.MouseEvent, opcao: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa fazer login para opinar.",
        variant: "destructive",
      });
      return;
    }

    if (market.status !== 'aberto') {
      toast({
        title: "Mercado fechado",
        description: "Este mercado não está mais aceitando análises.",
        variant: "destructive",
      });
      return;
    }

    openBet(opcao);
  };

  const openBet = (opcao: string) => {
    setSelectedOption(opcao);
    setBetModalOpen(true);
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login necessário",  
        description: "Você precisa fazer login para salvar mercados.",
        variant: "destructive",
      });
      return;
    }

    toggleWatchlist.mutate({ marketId: market.id, isWatched });
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: market.titulo,
        text: market.descricao,
        url: window.location.origin + `/market/${market.id}`
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/market/${market.id}`);
      toast({
        title: "Link copiado!",
        description: "O link do mercado foi copiado para a área de transferência.",
      });
    }
  };

  // Get yes/no percentages from actual pool data
  const yesOption = detailedPool?.options.find(opt => 
    opt.label.toLowerCase().includes('sim') || opt.label.toLowerCase().includes('yes')
  );
  const noOption = detailedPool?.options.find(opt => 
    opt.label.toLowerCase().includes('não') || opt.label.toLowerCase().includes('no')
  );

  // Use real pool percentages or default to 50/50
  const yesPercentage = yesOption?.chance || 50;
  const noPercentage = noOption?.chance || 50;

  return (
    <>
      <div className={cn(
        "bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 dark:bg-card bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm relative",
        className
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[#ff2389]/5 pointer-events-none"></div>
        <Link to={`/market/${market.id}`} className="block relative z-10">
          {/* Header */}
          <div 
            className="p-4 pb-3 cursor-pointer" 
            onClick={() => navigate(`/market/${market.id}`)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 relative p-1"
                  style={{
                    backgroundColor: market.icon_url ? 'transparent' : '#00ff90'
                  }}
                >
                  {market.icon_url ? (
                    <img 
                      src={market.icon_url}
                      alt={`Ícone do mercado: ${market.titulo}`}
                      className="w-full h-full object-contain"
                    />
                  ) : market.thumbnail_url ? (
                    <img 
                      src={market.thumbnail_url}
                      alt={`Thumbnail do mercado: ${market.titulo}`}
                      className="w-full h-full object-cover rounded-sm"
                    />
                  ) : null}
                  {showHotIcon && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 rounded-full p-1.5 shadow-lg shadow-orange-500/50 animate-pulse-glow">
                      <Flame className="w-4 h-4 text-white animate-fire-flicker" />
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
                  {getCategoryDisplayName(market.categoria)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleBookmarkClick}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <Bookmark className={cn("w-4 h-4", isWatched ? "fill-current text-green-600" : "text-gray-400")} />
                </button>
                <button 
                  onClick={handleShareClick}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight mb-3">
              {market.titulo}
            </h3>

            {/* Prediction Buttons - Kalshi Style */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/market/${market.id}`);
                }}
                disabled={market.status !== 'aberto'}
                style={{ backgroundColor: '#00ff9020', borderColor: '#00ff90', color: '#00ff90' }}
                className="h-12 rounded-xl border text-sm font-medium transition-colors relative overflow-hidden hover:opacity-80 w-full"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">SIM</span>
                  <span className="text-xs opacity-80">{(market.odds?.sim || 1.5).toFixed(1)}X</span>
                </div>
              </Button>
              
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/market/${market.id}`);
                }}
                disabled={market.status !== 'aberto'}
                style={{ backgroundColor: '#ff238920', borderColor: '#ff2389', color: '#ff2389' }}
                className="h-12 rounded-xl border text-sm font-medium transition-colors relative overflow-hidden hover:opacity-80 w-full"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">NÃO</span>
                  <span className="text-xs opacity-80">{(market.odds?.não || market.odds?.nao || 1.5).toFixed(1)}X</span>
                </div>
              </Button>
            </div>

            {/* Odds Progress Bar - Below buttons */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>SIM {Math.round(yesPercentage)}%</span>
                <span>NÃO {Math.round(noPercentage)}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-[#00ff90] transition-all duration-300"
                  style={{ width: `${yesPercentage}%` }}
                />
                <div 
                  className="h-full bg-[#ff2389] transition-all duration-300"
                  style={{ width: `${noPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </Link>

        {/* Footer */}
        <div className="px-4 pb-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimeLeft(market.end_date)}</span>
            </div>
            <span>Vol: {formatVolume(detailedPool?.totalPool || stats?.vol_total || 0)}</span>
          </div>
        </div>
      </div>

      <BetModal
        open={betModalOpen}
        onOpenChange={setBetModalOpen}
        market={market}
        selectedOption={selectedOption}
        userBalance={profile?.saldo_moeda || 0}
        recompensa={marketRewards?.options.find(o => o.label === selectedOption)?.recompensa || 1}
        userId={user?.id}
      />
    </>
  );
});

export default MarketCardKalshi;