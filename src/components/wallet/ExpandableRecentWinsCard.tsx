import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FastPoolBet {
  id: string;
  amount_rioz: number;
  odds: number;
  payout_amount: number;
  side: string;
  created_at: string;
  processed: boolean;
  pool_id: string;
  fast_pools: {
    asset_name: string;
    result: string;
  };
}

export const ExpandableRecentWinsCard = () => {
  const { user } = useAuth();
  const [bets, setBets] = useState<FastPoolBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchWinningBets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('fast_pool_bets')
        .select(`
          *,
          fast_pools (
            asset_name,
            result
          )
        `)
        .eq('user_id', user.id)
        .eq('processed', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBets(data || []);
    } catch (error) {
      console.error('Error fetching winning bets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinningBets();

    const channel = supabase
      .channel('fast_pool_bets_wins')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fast_pool_bets',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchWinningBets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const displayedBets = expanded ? bets : bets.slice(0, 5);

  return (
    <Card className="bg-gradient-to-b from-[#ff2389]/20 to-secondary-glass border-border/50 overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-[#ff2389] via-[#ff2389]/70 to-[#ff2389]"></div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Fast Markets
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        ) : bets.length > 0 ? (
          <>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {displayedBets.map((bet) => {
                const pool = bet.fast_pools as any;
                const profit = bet.payout_amount - bet.amount_rioz;
                const isWin = profit > 0;

                return (
                  <div
                    key={bet.id}
                    className={`p-3 rounded-lg border ${
                      isWin 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-red-500/30 bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4 text-[#ff2389]" />
                          <h4 className="font-medium text-sm">
                            {pool?.asset_name || 'Fast Pool'}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {bet.side === 'subiu' ? 'Subiu' : 'Desceu'} • @{bet.odds.toFixed(2)}x
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(bet.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                      
                      <div className="text-right ml-3">
                        <div className={`text-sm font-bold ${
                          isWin ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {isWin ? '+' : ''}{profit.toFixed(0)} RZ
                        </div>
                        <div className="text-xs text-muted-foreground">
                          de {bet.amount_rioz} RZ
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {bets.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-3"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Ver mais ({bets.length - 5})
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma atividade no Fast ainda</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
