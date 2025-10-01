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
    queryKey: ['fast-markets-transactions', user?.id],
    queryFn: async (): Promise<WinRecord[]> => {
      if (!user?.id) return [];
      
      // Get Fast Markets final results only (victories and defeats)
      const { data: fastTransactions, error: fastError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .or('descricao.like.Fast Market - Vitória%,descricao.like.Fast Market - Derrota%')
        .order('created_at', { ascending: false })
        .limit(10);

      if (fastError) throw fastError;

      const fastRecords = (fastTransactions || []).map(tx => ({
        id: tx.id,
        market_id: tx.market_id || 'fast-market',
        amount: tx.tipo === 'credito' ? tx.valor : -tx.valor, // Negative for losses
        created_at: tx.created_at,
        market_title: tx.descricao.replace('Fast Market - Vitória - ', '').replace('Fast Market - Derrota - ', '')
      }));

      return fastRecords;
    },
    enabled: !!user?.id,
  });

  const totalWins = recentWins.reduce((sum, win) => sum + win.amount, 0);

  return (
    <Card className="bg-gradient-to-br from-[#ff2389]/5 to-[#ff2389]/10 border-[#ff2389]/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#ff2389]">
          <Trophy className="w-5 h-5" />
          Fast Markets
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
              Nenhuma transação recente
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Participe dos Fast Markets para ver seus resultados aqui!
            </p>
          </div>
        ) : (
          <>
            <div className={`rounded-lg p-4 mb-4 ${totalWins >= 0 ? 'bg-[#00ff90]/10' : 'bg-[#ff2389]/10'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resultado Líquido</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${totalWins >= 0 ? 'text-[#00ff90]' : 'text-[#ff2389]'}`} />
                  <span className={`text-xl font-bold ${totalWins >= 0 ? 'text-[#00ff90]' : 'text-[#ff2389]'}`}>
                    {totalWins >= 0 ? '+' : ''}{totalWins.toLocaleString()} RZ
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {recentWins.map((win) => (
                <div
                  key={win.id}
                  className={`flex items-center justify-between p-3 rounded-lg bg-card/50 border transition-colors ${
                    win.amount >= 0 
                      ? 'border-[#00ff90]/30 hover:border-[#00ff90]/50' 
                      : 'border-[#ff2389]/30 hover:border-[#ff2389]/50'
                  }`}
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
                    <span className={`text-sm font-bold ${win.amount >= 0 ? 'text-[#00ff90]' : 'text-[#ff2389]'}`}>
                      {win.amount >= 0 ? '+' : ''}{win.amount.toLocaleString()} RZ
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
