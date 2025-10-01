import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WinRecord {
  id: string;
  market_id: string;
  amount: number;
  created_at: string;
  market_title?: string;
}

export const RecentWinsCard = () => {
  const { user } = useAuth();

  const { data: recentWins = [], isLoading } = useQuery({
    queryKey: ['recent-wins', user?.id],
    queryFn: async (): Promise<WinRecord[]> => {
      if (!user?.id) return [];
      
      // Get winning orders (completed with profit)
      const { data: winningOrders, error } = await supabase
        .from('orders')
        .select(`
          id,
          market_id,
          quantidade_moeda,
          created_at,
          cashout_amount,
          markets!inner(titulo)
        `)
        .eq('user_id', user.id)
        .eq('status', 'ganhou')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (winningOrders || []).map(order => ({
        id: order.id,
        market_id: order.market_id,
        amount: (order.cashout_amount || 0) - order.quantidade_moeda,
        created_at: order.created_at,
        market_title: (order.markets as any)?.titulo || 'Mercado'
      }));
    },
    enabled: !!user?.id,
  });

  const totalWins = recentWins.reduce((sum, win) => sum + win.amount, 0);

  return (
    <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-success">
          <Trophy className="w-5 h-5" />
          Últimos Ganhos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        ) : recentWins.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Nenhuma vitória recente
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Continue apostando para ver seus ganhos aqui!
            </p>
          </div>
        ) : (
          <>
            <div className="bg-success/10 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total ganho (últimas 5)</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-xl font-bold text-success">
                    +{totalWins.toLocaleString()} RZ
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {recentWins.map((win) => (
                <div
                  key={win.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-success/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {win.market_title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(win.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-sm font-bold text-success">
                      +{win.amount.toLocaleString()} RZ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
