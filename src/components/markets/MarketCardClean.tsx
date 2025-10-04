import React, { useState } from 'react';
import { Bookmark, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Market } from '@/types';
import { MinimalOptionRow } from '@/components/markets/MinimalOptionRow';
import BetModal from './BetModal';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useMarketPoolDetailed } from '@/hooks/useMarketPoolsDetailed';
import { useMarketRewards } from '@/hooks/useMarketRewards';
import { useMarketStats } from '@/hooks/useMarketStats';
import { useIsWatched, useToggleWatchlist } from '@/hooks/useWatchlist';
import { formatVolume, formatTimeLeft } from '@/lib/format';
import { getPlaceholderThumbnail } from '@/lib/market-utils';
import { getOptionVariant, isBinaryLayout, isThreeWayLayout, getOptionAriaLabel } from '@/lib/market-colors';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { LazyImage } from '@/components/ui/lazy-image';


interface MarketCardCleanProps {
  market: Market;
  className?: string;
}


function CardFooter({
  vol, endISO, periodicidade, isWatched,
  onToggleWatch, onShare
}: { vol: number; endISO: string; periodicidade?: string; isWatched: boolean; onToggleWatch: (e: React.MouseEvent) => void; onShare: (e: React.MouseEvent) => void }) {
  return (
    <div className="mt-4 pt-4 border-t border-[color:var(--border-soft)] flex items-center justify-between">
      <span className="text-sm text-[color:var(--text-secondary)]">
        {formatVolume(vol)} · {formatTimeLeft(endISO)}
      </span>
      <div className="flex items-center gap-3">
        <button 
          aria-label={isWatched ? "Remover dos salvos" : "Salvar mercado"} 
           className="p-2 rounded-lg hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={onToggleWatch}
        >
          <Bookmark className={cn("w-5 h-5", isWatched && "fill-current text-primary")} />
        </button>
        <button 
          aria-label="Compartilhar mercado" 
          className="p-2 rounded-lg hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary min-w-[44px] min-h-[44px] flex items-center justify-center" 
          onClick={onShare}
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

const MarketCardClean = React.memo(function MarketCardClean({ market, className }: MarketCardCleanProps) {
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

  const topOptions = detailedPool?.options
    .sort((a, b) => b.chance - a.chance)
    .slice(0, 2) || [];

  return (
    <>
      <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--bg-card)] p-5 md:p-6 transition-all duration-300 min-h-[160px] flex flex-col justify-between group hover:shadow-[0_0_0_2px_rgba(0,255,145,0.15),0_0_0_4px_rgba(0,255,145,0.08)] hover:border-[#00FF91]/30"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 255, 145, 0.03), transparent 70%)',
        }}
      >
        <Link to={`/market/${market.id}`} className="block">
          <div className="flex flex-col min-h-[180px]">
            {/* Header with thumbnail, category and status */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                  {market.thumbnail_url ? (
                    <LazyImage 
                      src={market.thumbnail_url}
                      alt={`Thumbnail do mercado: ${market.titulo}`}
                      className="w-full h-full object-cover rounded-lg"
                      placeholder={<span className="text-base">{getPlaceholderThumbnail(market.categoria)}</span>}
                    />
                  ) : (
                    <img 
                      src={`/assets/icons/${market.categoria.toLowerCase()}.png`}
                      alt={market.categoria}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300FF91"><circle cx="12" cy="12" r="10"/></svg>';
                      }}
                    />
                  )}
                </div>
                
                {/* Category Badge */}
                <Badge 
                  variant="outline" 
                  className="text-xs px-3 h-8 font-semibold rounded-full bg-[#0f1a14] text-[#00FF91] border-[#00FF91]/25"
                >
                  {getCategoryDisplayName(market.categoria)}
                </Badge>
              </div>

              {/* Status Badge */}
              <StatusBadge 
                kind={market.status === 'fechado' ? 'encerrado' : market.status === 'liquidado' ? 'liquidado' : 'aberto'}
              >
                {market.status === 'fechado' ? 'Encerrado' : market.status === 'liquidado' ? 'Liquidado' : 'Aberto'}
              </StatusBadge>
            </div>

            {/* Body - flex-1 pushes footer down */}
            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-xl md:text-2xl font-extrabold mb-2 text-foreground line-clamp-2 leading-tight">
                  {market.titulo}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground line-clamp-2 leading-relaxed mt-1.5">
                  {market.descricao}
                </p>
              </div>

              {/* Options Section */}
              <div className="space-y-2.5">
                {/* Unified layout for all market types */}
                {isBinaryLayout(market) || isThreeWayLayout(market) ? (
                  /* Binary and Three-way markets: All options as minimal rows */
                  detailedPool?.options.map((option, index) => (
                    <MinimalOptionRow
                      key={option.label}
                       label={option.label.toUpperCase().replace(/NAO/g, 'NÃO')}
                       percentage={Math.round(option.chance)}
                       bettors={option.bettors}
                      pool={option.pool}
                      recompensa={marketRewards?.options.find(o => o.label === option.label)?.recompensa || 1}
                      variant={getOptionVariant(market, index, option.label)}
                      onClick={() => openBet(option.label)}
                      disabled={market.status !== 'aberto'}
                      ariaLabel={getOptionAriaLabel(option.label)}
                    />
                  ))
                ) : (
                  /* Multi-option markets: Top 2 options + indicator */
                  <>
                    {topOptions.map((option, index) => (
                      <MinimalOptionRow
                        key={option.label}
                         label={option.label.toUpperCase().replace(/NAO/g, 'NÃO')}
                         percentage={Math.round(option.chance)}
                         bettors={option.bettors}
                        pool={option.pool}
                        recompensa={marketRewards?.options.find(o => o.label === option.label)?.recompensa || 1}
                        variant={index === 0 ? 'yes' : 'neutral'}
                        onClick={() => openBet(option.label)}
                        disabled={market.status !== 'aberto'}
                        ariaLabel={getOptionAriaLabel(option.label)}
                      />
                    ))}
                    {detailedPool && detailedPool.options.length > 2 && (
                      <div className="text-center text-sm text-muted-foreground pt-2">
                        +{detailedPool.options.length - 2} opções
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Footer fixo */}
            <CardFooter
              vol={detailedPool?.totalPool || stats?.vol_total || 0}
              endISO={market.end_date}
              periodicidade={market.periodicidade}
              isWatched={isWatched}
              onToggleWatch={handleBookmarkClick}
              onShare={handleShareClick}
            />
          </div>
          
          {/* Status indicators - Remove as they're now in header */}
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

export default MarketCardClean;