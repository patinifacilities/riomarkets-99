import React, { useState } from 'react';
import { Bookmark, Share2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
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
}

const MarketCardKalshi = React.memo(function MarketCardKalshi({ market, className }: MarketCardKalshiProps) {
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('sim');
  
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

  // Get yes/no percentages
  const yesOption = detailedPool?.options.find(opt => 
    opt.label.toLowerCase().includes('sim') || opt.label.toLowerCase().includes('yes')
  );
  const noOption = detailedPool?.options.find(opt => 
    opt.label.toLowerCase().includes('não') || opt.label.toLowerCase().includes('no')
  );

  const yesPercentage = yesOption ? Math.round(yesOption.chance) : 50;
  const noPercentage = noOption ? Math.round(noOption.chance) : 50;

  return (
    <>
      <div className={cn(
        "bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 dark:bg-card",
        className
      )}>
        <Link to={`/market/${market.id}`} className="block">
          {/* Header */}
          <div className="p-4 pb-3">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-sm bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {market.thumbnail_url ? (
                    <img 
                      src={market.thumbnail_url}
                      alt={`Thumbnail do mercado: ${market.titulo}`}
                      className="w-full h-full object-cover rounded-sm"
                    />
                  ) : (
                    <img 
                      src={`/assets/icons/${market.categoria.toLowerCase()}.png`}
                      alt={market.categoria}
                      className="w-4 h-4 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
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
                  <Bookmark className={cn("w-4 h-4", isWatched ? "fill-current text-blue-600" : "text-gray-400")} />
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

            {/* Odds Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>SIM {yesPercentage}%</span>
                <span>NÃO {noPercentage}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success transition-all duration-300"
                  style={{ width: `${yesPercentage}%` }}
                />
              </div>
            </div>

            {/* Prediction Buttons - Kalshi Style */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button
                onClick={(e) => handleBetClick(e, yesOption?.label || 'sim')}
                disabled={market.status !== 'aberto'}
                style={{ backgroundColor: '#00ff9020', borderColor: '#00ff90', color: '#00ff90' }}
                className="h-12 rounded-lg border text-sm font-medium transition-colors relative overflow-hidden hover:opacity-80"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">SIM</span>
                  <span className="text-xs opacity-80">{yesOption ? (1 / (yesPercentage / 100)).toFixed(1) : '2.0'}X</span>
                </div>
              </Button>
              
              <Button
                onClick={(e) => handleBetClick(e, noOption?.label || 'não')}
                disabled={market.status !== 'aberto'}
                style={{ backgroundColor: '#ff238920', borderColor: '#ff2389', color: '#ff2389' }}
                className="h-12 rounded-lg border text-sm font-medium transition-colors relative overflow-hidden hover:opacity-80"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold">NÃO</span>
                  <span className="text-xs opacity-80">{noOption ? (1 / (noPercentage / 100)).toFixed(1) : '2.0'}X</span>
                </div>
              </Button>
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