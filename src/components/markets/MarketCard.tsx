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
    <Card className="group hover:shadow-md transition-all duration-200 bg-card border border-border/50 hover:border-border rounded-lg overflow-hidden">
      <CardContent className="p-0">
        {/* Market Header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                </div>
                <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted/50">
                  {market.categoria}
                </Badge>
              </div>
              <h3 className="font-medium text-sm leading-tight text-foreground mb-1">
                {market.titulo}
              </h3>
              <div className="text-xs text-muted-foreground">
                Termina {daysLeft > 0 ? `em ${daysLeft} dias` : 'hoje'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Volume</div>
              <div className="font-semibold text-sm text-foreground">
                {formatVolume(pool?.total_pool || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="p-4 space-y-3">
          <div 
            className="flex items-center justify-between p-3 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer border border-transparent hover:border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-foreground">
                SIM
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground mb-1">
                {yesRecompensa ? `${(yesRecompensa * 100).toFixed(0)}¢` : '--'}
              </div>
              <div className="text-xs text-muted-foreground">
                {pool?.percent_sim ? `${pool.percent_sim.toFixed(0)}%` : '--'}
              </div>
            </div>
          </div>
          
          <div 
            className="flex items-center justify-between p-3 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer border border-transparent hover:border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-foreground">
                NÃO
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground mb-1">
                {noRecompensa ? `${(noRecompensa * 100).toFixed(0)}¢` : '--'}
              </div>
              <div className="text-xs text-muted-foreground">
                {pool?.percent_nao ? `${pool.percent_nao.toFixed(0)}%` : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{formatVolume(pool?.total_pool || 0)} participantes</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateReward}
                className="gap-1 h-7 px-2 text-xs border-primary/40 text-primary hover:bg-primary/10"
              >
                <Calculator className="w-3 h-3" />
                Simular
              </Button>
              
              <Link to={`/market/${market.id}`}>
                <Button size="sm" className="gap-1 h-7 px-2 text-xs">
                  <TrendingUp className="w-3 h-3" />
                  Opinar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketCard;