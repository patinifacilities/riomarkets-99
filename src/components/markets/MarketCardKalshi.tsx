import React, { useState } from 'react';
import { Bookmark, Share2, Clock, Users, TrendingUp, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Market } from '@/types';
import BetModal from './BetModal';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useMarketPoolDetailed } from '@/hooks/useMarketPoolsDetailed';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

  // Get users who actually placed orders on this market
  const { data: marketParticipants = [] } = useQuery({
    queryKey: ['market-participants', market.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_orders')
        .select('user_id, profiles!inner(id, nome, profile_pic_url)')
        .eq('market_id', market.id)
        .eq('status', 'active')
        .limit(20);

      if (error) {
        console.error('Error fetching market participants:', error);
        return [];
      }

      // Get unique users
      const uniqueUsers = Array.from(
        new Map(data.map(item => [item.user_id, item.profiles])).values()
      );

      // Shuffle and get 2 random participants
      const shuffled = uniqueUsers.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 2);
    },
  });

  // Generate modern bit-style avatars for users without profile pics
  const generateAvatar = (userId: string, color: string) => {
    return (
      <div 
        className="w-6 h-6 rounded-full border-2 border-[#1a1a1a] shadow-lg ring-1 ring-white/10 flex items-center justify-center text-[8px] font-bold"
        style={{ 
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          boxShadow: `0 0 8px ${color}40`,
          color: '#fff'
        }}
      >
        {userId.substring(0, 2).toUpperCase()}
      </div>
    );
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

    // Navigate to market detail page instead of opening modal
    navigate(`/market/${market.id}`);
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

  // Get yes/no percentages and odds from actual pool data
  const yesOption = detailedPool?.options.find(opt => 
    opt.label.toLowerCase().includes('sim') || opt.label.toLowerCase().includes('yes')
  );
  const noOption = detailedPool?.options.find(opt => 
    opt.label.toLowerCase().includes('não') || opt.label.toLowerCase().includes('no')
  );

  // Use configured odds from market.odds or fallback to calculated odds
  const yesOdds = market.odds?.sim || (yesOption?.chance ? Math.max(1.01, 100 / yesOption.chance) : 1.5);
  const noOdds = market.odds?.nao || (noOption?.chance ? Math.max(1.01, 100 / noOption.chance) : 1.5);

  // Use real pool percentages or default to 50/50
  const yesPercentage = yesOption?.chance || 50;
  const noPercentage = noOption?.chance || 50;

  // Hot market logic
  const isHot = (stats?.vol_24h && stats.vol_24h > 100) || 
                (stats?.participantes && stats.participantes > 5) ||
                market.destaque;

  return (
    <>
      <div className={cn(
        "bg-card/40 backdrop-blur-xl border border-border rounded-2xl overflow-hidden transition-all duration-200 ease-out group relative",
        "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
        "hover:scale-[1.01] hover:-translate-y-0.5",
        className
      )}>
        {/* Em Atualização Overlay */}
        {(market as any).paused && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md z-30 rounded-2xl flex items-center justify-center">
            <div className="text-center p-6">
              <Settings className="w-12 h-12 mx-auto mb-3 text-primary animate-[spin_3s_linear_infinite]" />
              <h3 className="text-lg font-bold mb-1">Em Atualização</h3>
              <p className="text-sm text-muted-foreground">Este pool está sendo atualizado</p>
            </div>
          </div>
        )}
        <Link to={`/market/${market.id}`} className="block">
          {/* Image Header */}
          <div className="relative h-40 overflow-hidden bg-[#0A101A]">
            {(market.thumbnail_url || market.image_url || market.photo_url) && (
              <img 
                src={market.thumbnail_url || market.image_url || market.photo_url}
                alt={market.titulo}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/60 via-transparent to-transparent" />
            
            {/* Hot Badge with Enhanced Animation */}
            {isHot && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-gradient-to-r from-[#ff2389] via-[#ff4499] to-[#ff2389] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-[#ff2389]/50 animate-[gradient_3s_ease_infinite]" style={{ backgroundSize: '200% 200%' }}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-4 h-4 animate-[pulse_1.5s_ease-in-out_infinite]"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }}
                >
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
                HOT
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Title */}
            <h3 className="text-base font-semibold text-foreground mb-4 line-clamp-2 leading-snug transition-colors">
              {market.titulo}
            </h3>

            {/* Probability Bar */}
            <div className="mb-4">
              <div className="relative h-2.5 bg-[#0A101A] rounded-full overflow-hidden flex group">
                <div 
                  className="transition-all duration-700 ease-out relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-[shimmer_2s_ease-in-out_infinite]"
                  style={{ 
                    width: `${yesPercentage}%`,
                    backgroundColor: '#00ff90',
                    minWidth: yesPercentage > 0 && yesPercentage < 5 ? '4px' : '0'
                  }}
                />
                <div 
                  className="transition-all duration-700 ease-out relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-[shimmer_2s_ease-in-out_infinite]"
                  style={{ 
                    width: `${noPercentage}%`,
                    backgroundColor: '#ff2389',
                    minWidth: noPercentage > 0 && noPercentage < 5 ? '4px' : '0'
                  }}
                />
              </div>
            </div>

            {/* SIM/NÃO Buttons with Odds */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                onClick={(e) => handleBetClick(e, 'sim')}
                disabled={market.status !== 'aberto'}
                className="h-11 transition-all duration-300 font-semibold rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-[#00ff90]/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none dark:text-gray-900 light:text-gray-800"
                style={{ backgroundColor: '#00ff90' }}
              >
                SIM - {yesOdds.toFixed(2)}x
              </Button>
              
              <Button
                onClick={(e) => handleBetClick(e, 'não')}
                disabled={market.status !== 'aberto'}
                className="h-11 transition-all duration-300 font-semibold rounded-xl text-white hover:scale-105 hover:shadow-lg hover:shadow-[#ff2389]/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                style={{ backgroundColor: '#ff2389' }}
              >
                NÃO - {noOdds.toFixed(2)}x
              </Button>
            </div>

            {/* Footer Stats with User Avatars */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-2">
                    {marketParticipants.length > 0 ? (
                      marketParticipants.map((participant: any, i) => (
                        participant.profile_pic_url ? (
                          <img
                            key={participant.id}
                            src={participant.profile_pic_url}
                            alt={participant.nome}
                            className="w-6 h-6 rounded-full border-2 border-background shadow-lg ring-1 ring-white/10 transition-all duration-300 hover:scale-110 hover:z-10 object-cover"
                          />
                        ) : (
                          <React.Fragment key={participant.id}>
                            {generateAvatar(participant.id, i === 0 ? '#00ff90' : '#ff2389')}
                          </React.Fragment>
                        )
                      ))
                    ) : (
                      // Fallback to colored circles if no participants
                      ['#00ff90', '#ff2389'].map((color, i) => (
                        <div 
                          key={i}
                          className="w-6 h-6 rounded-full border-2 border-background shadow-lg ring-1 ring-white/10"
                          style={{ 
                            background: `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)`,
                            boxShadow: `0 0 8px ${color}40`
                          }}
                        />
                      ))
                    )}
                  </div>
                  <span className="ml-1.5 font-medium text-foreground">+{stats?.participantes || 13}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <img 
                    src="/storage/v1/object/public/assets/asset_a435aa1c-9553-4fad-8609-5bd54ef07447_1759612614765.png" 
                    alt="Rioz"
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-foreground">Vol {formatVolume(detailedPool?.totalPool || stats?.vol_total || 0)} Rioz</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimeLeft(market.end_date)}</span>
              </div>
            </div>

            {/* Additional details for slider */}
            {isSlider && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Volume 24h:</span>
                  <span className="text-foreground font-medium">{formatVolume((detailedPool?.totalPool || stats?.vol_total || 0) * 0.3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Categoria:</span>
                  <span className="text-foreground capitalize">{market.categoria}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-foreground capitalize">{market.status}</span>
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
