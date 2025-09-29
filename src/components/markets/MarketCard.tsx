import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMarketPool } from '@/hooks/useMarketPoolsNew';
import { Market } from '@/types';

interface MarketCardProps {
  market: Market;
}

const MarketCard = ({ market }: MarketCardProps) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { data: pool } = useMarketPool(market.id);

  const isHovered = hoveredCard === market.id;
  
  const getDaysUntilEnd = (endDate: string): number => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilEnd(market.end_date);
  
  const getStatusColor = (status: string) => {
    const colors = {
      'aberto': 'bg-success-muted text-success',
      'fechado': 'bg-muted text-muted-foreground',
      'liquidado': 'bg-accent-muted text-accent'
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'economia': 'bg-success-muted text-success',
      'esportes': 'bg-accent-muted text-accent',
      'política': 'bg-danger-muted text-danger',
      'clima': 'bg-primary-glow/20 text-primary'
    };
    return colors[category as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const handleBetClick = (option: string) => {
    // This will be handled by the link to the detail page
    console.log('Bet on:', option);
  };

  // Calculate percentages and rewards
  const yesRecompensa = market.odds?.sim || 1.5;
  const noRecompensa = market.odds?.não || market.odds?.nao || 1.5;

  return (
    <Card className={`market-card transition-all duration-300 hover:shadow-lg border-border/50 bg-secondary-glass border-border-secondary ${
      isHovered ? 'ring-2 ring-[#ff2389]/50 shadow-[#ff2389]/20' : ''
    }`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            <Badge className={getCategoryColor(market.categoria)}>
              {market.categoria}
            </Badge>
            <Badge className={getStatusColor(market.status)}>
              {market.status}
            </Badge>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {daysLeft > 0 ? `${daysLeft}d` : 'Encerrando'}
            </div>
          </div>
        </div>

        {/* Market Image */}
        {market.thumbnail_url && (
          <div className="aspect-[16/7] rounded-lg overflow-hidden bg-muted">
            <img 
              src={market.thumbnail_url} 
              alt={market.titulo}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <Link to={`/market/${market.id}`} className="block">
          <h3 className="text-sm font-semibold leading-tight hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
            {market.titulo}
          </h3>
        </Link>

        {/* Pool Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {pool?.total_pool || 0} RIOZ total
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {Math.max(100, (pool?.total_pool || 0) * 2)} análises
          </div>
        </div>

        {/* Multiple options or binary display */}
        {market.opcoes.length > 2 ? (
          // Multiple options - show first 3
          market.opcoes.slice(0, 3).map((opcao: string, index: number) => {
            const opcaoRecompensa = market.odds?.[opcao] || 1.5;
            const opcaoPercent = pool?.percent_sim || 0; // This would need to be calculated per option
            
            return (
              <Link 
                key={opcao}
                to={`/market/${market.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer border border-transparent hover:border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-foreground">
                      {opcao.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {opcaoRecompensa ? `${opcaoRecompensa.toFixed(2)}x` : '--'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {opcaoPercent ? `${opcaoPercent.toFixed(0)}%` : '--'}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          // Binary options - show SIM/NÃO
          <>
            <Link 
              to={`/market/${market.id}`}
              className="block"
            >
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer border border-transparent hover:border-border/50">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-foreground">
                    SIM
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground mb-1">
                    {yesRecompensa ? `${yesRecompensa.toFixed(2)}x` : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pool?.percent_sim ? `${pool.percent_sim.toFixed(0)}%` : '--'}
                  </div>
                </div>
              </div>
            </Link>

            <Link 
              to={`/market/${market.id}`}
              className="block"
            >
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer border border-transparent hover:border-border/50">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-foreground">
                    NÃO
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground mb-1">
                    {noRecompensa ? `${noRecompensa.toFixed(2)}x` : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pool?.percent_nao ? `${pool.percent_nao.toFixed(0)}%` : '--'}
                  </div>
                </div>
              </div>
            </Link>
          </>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {market.opcoes.length > 2 ? (
            <div className="col-span-2 space-y-2">
              {market.opcoes.slice(0, 3).map((opcao: string) => {
                const odds = market.odds?.[opcao] || 1.5;
                return (
                  <Button
                    key={opcao}
                    size="sm"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-3 rounded-lg"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBetClick(opcao);
                    }}
                  >
                    {opcao.toUpperCase()} {odds.toFixed(2)}x
                  </Button>
                );
              })}
              {market.opcoes.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{market.opcoes.length - 3} mais opções
                </div>
              )}
            </div>
          ) : (
            <>
              <Button
                size="sm"
                className="bg-[#00FF91] hover:bg-[#00FF91]/90 text-black font-medium py-2 px-3 rounded-lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBetClick('sim');
                }}
              >
                SIM {(market.odds?.sim || 1.5).toFixed(2)}x
              </Button>
              <Button
                size="sm"
                className="bg-[#FF1493] hover:bg-[#FF1493]/90 text-white font-medium py-2 px-3 rounded-lg hover:shadow-[0_0_20px_rgba(255,20,147,0.4)]"
                onMouseEnter={() => setHoveredCard(market.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBetClick('não');
                }}
              >
                NÃO {(market.odds?.não || market.odds?.nao || 1.5).toFixed(2)}x
              </Button>
            </>
          )}
        </div>

        {/* Multiple options indicator */}
        {market.opcoes.length > 3 && (
          <div className="pt-2">
            <Link to={`/market/${market.id}`}>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Ver todas as {market.opcoes.length} opções
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketCard;