import React, { useState } from 'react';
import { Bookmark, Share2, Clock, Users, TrendingUp, Settings } from 'lucide-react';
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
        "bg-[#1a1a1a]/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 group relative",
        // Liquid glass effect
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/[0.05] before:to-transparent before:opacity-0 before:group-hover:opacity-100 before:transition-opacity before:pointer-events-none",
        "after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-tr after:from-transparent after:via-white/[0.03] after:to-white/[0.08] after:opacity-0 after:group-hover:opacity-100 after:transition-opacity after:pointer-events-none",
        "hover:border-primary/30",
        "hover:shadow-[0_0_20px_rgba(0,255,144,0.15)]",
        className
      )}>
        {/* Em Atualização Overlay */}
        {(market as any).paused && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md z-20 rounded-2xl flex items-center justify-center">
            <div className="text-center p-6">
              <Settings className="w-12 h-12 mx-auto mb-3 text-primary animate-[spin_3s_linear_infinite]" />
              <h3 className="text-lg font-bold mb-1">Em Atualização</h3>
              <p className="text-sm text-muted-foreground">Este pool está sendo atualizado</p>
            </div>
          </div>
        )}
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
            
            {/* Hot Badge with Fire Icon Only */}
            {isHot && (
              <div className="absolute top-3 right-3 z-10">
                <img 
                  src={hotFire} 
                  alt="Hot Market" 
                  className="w-10 h-10 animate-flame brightness-125 contrast-125 saturate-150" 
                  style={{
                    filter: 'brightness(1.4) contrast(1.4) saturate(1.7) drop-shadow(0 0 12px rgba(255,100,0,1))',
                  }}
                />
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
                  className="transition-all duration-500"
                  style={{ 
                    width: `${yesPercentage}%`,
                    backgroundColor: '#00ff90'
                  }}
                />
                <div 
                  className="transition-all duration-500"
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
                className="h-11 transition-all duration-300 font-semibold rounded-xl text-gray-900 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#00ff90' }}
              >
                SIM
              </Button>
              
              <Button
                onClick={(e) => handleBetClick(e, 'não')}
                disabled={market.status !== 'aberto'}
                className="h-11 transition-all duration-300 font-semibold rounded-xl text-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
