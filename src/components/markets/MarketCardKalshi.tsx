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
import riozCoin from '@/assets/rioz-coin.png';
import hotFire from '@/assets/hot-fire.png';

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

  // Hot market logic
  const isHot = (stats?.vol_24h && stats.vol_24h > 100) || 
                (stats?.participantes && stats.participantes > 5) ||
                market.destaque;

  // Random color assignment for only 2 profile avatars with fade gradient
  const getRandomAvatarColors = () => {
    const colors = ['#00ff90', '#ff2389'];
    return Math.random() > 0.5 ? colors : colors.reverse();
  };
  
  const avatarColors = getRandomAvatarColors();

  return (
    <>
      <div className={cn(
        "bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#3a3a3a] transition-all duration-200 group relative",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none",
        "after:absolute after:inset-0 after:rounded-2xl after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300 after:pointer-events-none",
        "after:bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.06),transparent_50%)]",
        className
      )}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
      }}>
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
            
            {/* Hot Badge with Improved Animation */}
            {isHot && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-gradient-to-r from-[#ff2389] to-[#ff6b9d] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
                <svg 
                  className="w-4 h-4 animate-bounce" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  style={{ 
                    filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))',
                    animation: 'bounce 1s ease-in-out infinite'
                  }}
                >
                  <path d="M13.5 2C13.5 2 11 6 11 9.5C11 11.71 12.79 13.5 15 13.5C17.21 13.5 19 11.71 19 9.5C19 6 16.5 2 16.5 2L15 4.5L13.5 2M8.5 9C8.5 9 6 13 6 16.5C6 18.71 7.79 20.5 10 20.5C12.21 20.5 14 18.71 14 16.5C14 13 11.5 9 11.5 9L10 11.5L8.5 9Z" />
                </svg>
                HOT
              </div>
            )}
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
                className="h-11 transition-all duration-300 font-semibold rounded-xl text-gray-900 hover:scale-105 hover:shadow-lg hover:shadow-[#00ff90]/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                style={{ backgroundColor: '#00ff90' }}
              >
                SIM
              </Button>
              
              <Button
                onClick={(e) => handleBetClick(e, 'não')}
                disabled={market.status !== 'aberto'}
                className="h-11 transition-all duration-300 font-semibold rounded-xl text-white hover:scale-105 hover:shadow-lg hover:shadow-[#ff2389]/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                style={{ backgroundColor: '#ff2389' }}
              >
                NÃO
              </Button>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-2">
                    {avatarColors.map((color, i) => (
                      <div 
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-[#1a1a1a] shadow-lg ring-1 ring-white/10 transition-all duration-300 hover:scale-110 hover:z-10"
                        style={{ 
                          background: `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)`,
                          boxShadow: `0 0 8px ${color}40`
                        }}
                      />
                    ))}
                  </div>
                  <span className="ml-1.5 font-medium">+{stats?.participantes || 13}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <img 
                    src={riozCoin} 
                    alt="RIOZ" 
                    className="w-3.5 h-3.5"
                  />
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
