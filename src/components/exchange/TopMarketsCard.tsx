import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Market } from '@/types';
import { formatVolume } from '@/lib/format';

export const TopMarketsCard = () => {
  const [topMarkets, setTopMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopMarkets();
  }, []);

  const fetchTopMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select(`
          *,
          market_stats(vol_total)
        `)
        .eq('status', 'aberto')
        .order('market_stats.vol_total', { ascending: false })
        .limit(4);

      if (error) throw error;
      setTopMarkets((data || []).map(market => ({
        ...market,
        opcoes: Array.isArray(market.opcoes) ? market.opcoes : [],
        odds: typeof market.odds === 'object' ? market.odds : {},
        recompensas: typeof market.odds === 'object' ? market.odds : {}
      })) as Market[]);
    } catch (error) {
      console.error('Error fetching top markets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4" />
            Top Mercados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4" />
          Top Mercados por Volume
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topMarkets.map((market) => (
          <Link key={market.id} to={`/market/${market.id}`}>
            <div className="p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer border border-transparent hover:border-border/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium line-clamp-2 mb-1">
                    {market.titulo}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {market.categoria}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{formatVolume((market as any).market_stats?.vol_total || 0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {Math.ceil((new Date(market.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        
        {topMarkets.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nenhum mercado ativo encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
};