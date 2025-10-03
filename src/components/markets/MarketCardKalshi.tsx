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
  isSlider?: boolean;
}

const MarketCardKalshi = React.memo(function MarketCardKalshi({ market, className, showHotIcon, isSlider = false }: MarketCardKalshiProps) {
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

  // Random color assignment for profile avatars
  const getRandomAvatarColors = () => {
    const colors = ['#00ff90', '#ff2389'];
    return Array(3).fill(null).map(() => colors[Math.floor(Math.random() * colors.length)]);
  };
  
  const avatarColors = getRandomAvatarColors();

  return (
    <>
      <div className={cn(
        "bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#3a3a3a] transition-all duration-200 group",
        className
      )}>
        <Link to={`/market/${market.id}`} className="block">
          {/* Image Header */}
          <div className="relative h-40 overflow-hidden bg-[#2a2a2a]">
            {(market.thumbnail_url || market.image_url || market.photo_url) && (
              <img 
                src={market.thumbnail_url || market.image_url || market.photo_url}
                alt={market.titulo}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/60 via-transparent to-transparent" />
            
            {/* RIOZ Badge */}
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

            {/* Probability Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span className="font-medium">Sim {Math.round(yesPercentage)}%</span>
                <span className="font-medium">{Math.round(noPercentage)}% Não</span>
              </div>
              <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden flex">
                <div 
                  className="transition-all duration-300"
                  style={{ 
                    width: `${yesPercentage}%`,
                    backgroundColor: '#00ff90'
                  }}
                />
                <div 
                  className="transition-all duration-300"
                  style={{ 
                    width: `${noPercentage}%`,
                    backgroundColor: '#ff2389'
                  }}
                />
              </div>
            </div>

            {/* SIM/NÃO Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                onClick={(e) => handleBetClick(e, 'sim')}
                disabled={market.status !== 'aberto'}
                className="h-11 hover:opacity-80 transition-all font-semibold rounded-xl text-gray-900"
                style={{ backgroundColor: '#00ff90' }}
              >
                SIM
              </Button>
              
              <Button
                onClick={(e) => handleBetClick(e, 'não')}
                disabled={market.status !== 'aberto'}
                className="h-11 hover:opacity-80 transition-all font-semibold rounded-xl text-white"
                style={{ backgroundColor: '#ff2389' }}
              >
                NÃO
              </Button>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-1.5">
                    {avatarColors.map((color, i) => (
                      <div 
                        key={i}
                        className="w-5 h-5 rounded-full border border-[#1a1a1a]"
                        style={{ backgroundColor: color }}
                      />
                    ))}
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

            {/* Additional details for slider */}
            {isSlider && (
              <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Volume 24h:</span>
                  <span className="text-white font-medium">{formatVolume((detailedPool?.totalPool || stats?.vol_total || 0) * 0.3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Categoria:</span>
                  <span className="text-white capitalize">{market.categoria}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white capitalize">{market.status}</span>
                </div>
              </div>
            )}
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
