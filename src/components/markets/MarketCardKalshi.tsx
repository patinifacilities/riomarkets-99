import React, { useState } from 'react';
import { Bookmark, Share2, Clock, Users, TrendingUp } from 'lucide-react';
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

  // Gradient backgrounds based on category
  const categoryGradients: Record<string, string> = {
    'economia': 'from-green-600/20 via-green-500/10 to-transparent',
    'politica': 'from-purple-600/20 via-purple-500/10 to-transparent',
    'esportes': 'from-cyan-600/20 via-cyan-500/10 to-transparent',
    'entretenimento': 'from-yellow-600/20 via-yellow-500/10 to-transparent',
    'tecnologia': 'from-blue-600/20 via-blue-500/10 to-transparent',
    'clima': 'from-red-600/20 via-red-500/10 to-transparent'
  };

  const gradient = categoryGradients[market.categoria] || 'from-gray-600/20 via-gray-500/10 to-transparent';

  return (
    <>
      <div className={cn(
        "bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#3a3a3a] transition-all duration-200 group",
        className
      )}>
        <Link to={`/market/${market.id}`} className="block">
          {/* Image Header with Gradient Overlay */}
          <div className={cn("relative h-40 overflow-hidden bg-gradient-to-br", gradient)}>
            {market.thumbnail_url && (
              <img 
                src={market.thumbnail_url}
                alt={market.titulo}
                className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
            
            {/* USDC Badge or In-Play */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-blue-600/90 text-white border-0 backdrop-blur-sm">
                <div className="w-4 h-4 rounded-full bg-white mr-1.5 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-blue-600">R</span>
                </div>
                RIOZ
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Title */}
            <h3 className="text-base font-semibold text-white mb-4 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {market.titulo}
            </h3>

            {/* Probability Bar with Gradient */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span className="font-medium">{Math.round(yesPercentage)}%</span>
                <span className="font-medium">{Math.round(noPercentage)}%</span>
              </div>
              <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 transition-all duration-300"
                  style={{ width: `${yesPercentage}%` }}
                />
              </div>
            </div>

            {/* YES/NO Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                onClick={(e) => handleBetClick(e, 'sim')}
                disabled={market.status !== 'aberto'}
                className="h-11 bg-teal-900/40 hover:bg-teal-900/60 text-teal-400 border border-teal-700/50 rounded-xl font-semibold transition-all"
              >
                YES
              </Button>
              
              <Button
                onClick={(e) => handleBetClick(e, 'não')}
                disabled={market.status !== 'aberto'}
                className="h-11 bg-purple-900/40 hover:bg-purple-900/60 text-purple-400 border border-purple-700/50 rounded-xl font-semibold transition-all"
              >
                NO
              </Button>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border border-[#1a1a1a]" />
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border border-[#1a1a1a]" />
                  </div>
                  <span className="ml-1">+{stats?.participantes || 13}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>{formatVolume(detailedPool?.totalPool || stats?.vol_total || 0)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimeLeft(market.end_date)}</span>
              </div>
            </div>
          </div>
        </Link>
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
