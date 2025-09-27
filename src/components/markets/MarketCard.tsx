import { Clock, Users, TrendingUp, Calculator } from 'lucide-react';
import { Market } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useMarketPool } from '@/hooks/useMarketPoolsNew';
import { useRewardCalculator } from '@/store/useRewardCalculator';
import PoolProgressBar from './PoolProgressBar';
import { formatVolume, formatTimeLeft } from '@/lib/format';
import { getPlaceholderThumbnail } from '@/lib/market-utils';

interface MarketCardProps {
  market: Market;
}

const MarketCard = ({ market }: MarketCardProps) => {
  const { data: pool } = useMarketPool(market.id);
  const { openCalculator } = useRewardCalculator();
  
  const getDaysUntilEnd = (endDate: Date) => {
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'economia': 'bg-success-muted text-success',
      'esportes': 'bg-accent-muted text-accent',
      'política': 'bg-danger-muted text-danger',
      'clima': 'bg-primary-glow/20 text-primary',
      'tecnologia': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      'entretenimento': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
    };
    return colors[category as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const daysLeft = getDaysUntilEnd(new Date(market.end_date));
  const yesRecompensa = market.recompensas['sim'] || 1.5;
  const noRecompensa = market.recompensas['não'] || 1.5;

  const handleSimulateReward = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Calculate market probability from pool percentages
    const pMkt = pool?.percent_sim ? pool.percent_sim / 100 : null;
    
    openCalculator({
      marketId: market.id,
      suggestedValue: 100, // Default suggested value
      pMkt: pMkt,
    });
  };

  return (
    <Card className="group hover:shadow-elevated transition-all duration-300 bg-gradient-card border-border/50 hover:border-primary/20 rounded-[16px]">
      <CardContent className="px-6 py-5 md:px-6 md:py-5 sm:px-4 sm:py-4 space-y-4">
        {/* Header with thumbnail and category */}
        <div className="flex items-center gap-3">
          {/* Thumbnail placeholder */}
          <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(169 100% 50% / 0.2)' }}>
            <span className="text-base">{getPlaceholderThumbnail(market.categoria)}</span>
          </div>

          {/* Category and time */}
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <Badge className={getCategoryColor(market.categoria)}>
              <span className="h-7 px-3 text-xs flex items-center">{market.categoria}</span>
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {daysLeft > 0 ? `${daysLeft} dias` : 'Encerrando'}
            </div>
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <h3 className="text-[18px] md:text-[20px] font-semibold leading-tight line-clamp-2 tracking-tight group-hover:text-primary transition-colors">
            {market.titulo}
          </h3>
          
          <p className="text-[14px] text-muted-foreground leading-relaxed line-clamp-2">
            {market.descricao}
          </p>
        </div>

        {/* Options Section - Fixed height container for consistent footer alignment */}
        <div className="min-h-[152px] flex flex-col">
          <div className="space-y-2.5 flex-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="relative h-14 px-4 rounded-[12px] border border-[#E7EAF0] dark:border-[#252A33] bg-[#FFF] dark:bg-[#181B22] flex items-center justify-between">
                <span className="text-sm font-semibold uppercase text-[#167C3A] dark:text-[#29D17D]">SIM</span>
                <span className="font-bold text-[#167C3A] dark:text-[#29D17D]">{yesRecompensa.toFixed(2)}x recompensa</span>
                <div className="absolute left-4 right-4 bottom-1">
                  <div className="w-full h-1 bg-[#EDF2F7] dark:bg-[#1F2430]">
                    <div className="h-full bg-[#29D17D] transition-all duration-300" style={{ width: `${pool?.percent_sim || 0}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="relative h-14 px-4 rounded-[12px] border border-[#E7EAF0] dark:border-[#252A33] bg-[#FFF] dark:bg-[#181B22] flex items-center justify-between">
                <span className="text-sm font-semibold uppercase text-[#A83232] dark:text-[#F16A6A]">NÃO</span>
                <span className="font-bold text-[#A83232] dark:text-[#F16A6A]">{noRecompensa.toFixed(2)}x recompensa</span>
                <div className="absolute left-4 right-4 bottom-1">
                  <div className="w-full h-1 bg-[#EDF2F7] dark:bg-[#1F2430]">
                    <div className="h-full bg-[#F16A6A] transition-all duration-300" style={{ width: `${pool?.percent_nao || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-1 text-sm text-muted-foreground pl-1">
            <Users className="w-3 h-3" />
            <span>{formatVolume(pool?.total_pool || 0)}</span>
            <span>·</span>
            <span>{formatTimeLeft(market.end_date)}</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateReward}
              className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
            >
              <Calculator className="w-4 h-4" />
              Simular
            </Button>
            
            <Link to={`/market/${market.id}`}>
              <Button size="sm" className="gap-2 shadow-success">
                <TrendingUp className="w-4 h-4" />
                Opinar
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketCard;