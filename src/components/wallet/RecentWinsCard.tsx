import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface WinRecord {
  id: string;
  market_id: string;
  amount: number;
  created_at: string;
  market_title?: string;
}

export const RecentWinsCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: recentWins = [], isLoading } = useQuery({
    queryKey: ['fast-markets-transactions', user?.id],
    queryFn: async (): Promise<WinRecord[]> => {
      if (!user?.id) return [];
      
      // Get Fast Markets transactions (bets, victories and defeats)
      const { data: fastTransactions, error: fastError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .or('descricao.ilike.%Fast Market%')
        .order('created_at', { ascending: false });

      if (fastError) throw fastError;

      const fastRecords = (fastTransactions || []).map(tx => ({
        id: tx.id,
        market_id: tx.market_id || 'fast-market',
        amount: tx.tipo === 'credito' ? tx.valor : -tx.valor,
        created_at: tx.created_at,
        market_title: tx.descricao.replace('Fast Market - Vitória - ', '')
          .replace('Fast Market - Derrota - ', '')
          .replace('Fast Market - Aposta - ', 'Aposta - ')
      }));

      return fastRecords;
    },
    enabled: !!user?.id,
  });

  const totalPages = Math.ceil(recentWins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = recentWins.slice(startIndex, endIndex);
  
  const totalWins = recentWins.reduce((sum, win) => sum + win.amount, 0);

  return (
    <Card className="bg-gradient-to-br from-[#ff2389]/5 to-[#ff2389]/10 border-[#ff2389]/20">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-[#ff2389]">
          <Zap className="w-5 h-5" />
          Fast Markets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <div className={`rounded-lg p-4 ${totalWins >= 0 ? 'bg-[#00ff90]/10' : 'bg-[#ff2389]/10'}`}>
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
              {currentItems.map((win) => (
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
                      {new Date(win.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Gold Pass Button */}
            <Button 
              className="w-full bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-600 hover:from-yellow-600 hover:via-yellow-700 hover:to-amber-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-yellow-400/50"
              onClick={() => navigate('/profile')}
            >
              <span className="relative z-10">⭐ Upgrade para Gold Pass</span>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
