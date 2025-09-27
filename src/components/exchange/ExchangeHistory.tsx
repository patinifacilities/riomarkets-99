import { useEffect } from 'react';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { ExchangeService } from '@/services/exchange';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { track } from '@/lib/analytics';
import ExchangeExportButtons from './ExchangeExportButtons';

export const ExchangeHistory = () => {
  const { 
    history, 
    historyLoading, 
    historyError,
    historyPagination,
    fetchHistory 
  } = useExchangeStore();

  useEffect(() => {
    fetchHistory();
    track('view_history_page');
  }, [fetchHistory]);

  const handleRefresh = () => {
    fetchHistory(1);
  };

  const handlePageChange = (page: number) => {
    fetchHistory(page);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'filled':
        return <Badge variant="default" className="text-emerald-400 border-emerald-400">Executada</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSideIcon = (side: string) => {
    return side === 'buy_rioz' ? (
      <TrendingUp className="h-4 w-4 text-emerald-400" />
    ) : (
      <TrendingDown className="h-4 w-4 text-rose-400" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#00FF91]" />
            Histórico de Conversões
          </div>
          <div className="flex items-center gap-2">
            <ExchangeExportButtons className="hidden sm:flex" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={historyLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {historyLoading && history.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            Carregando histórico...
          </div>
        ) : historyError ? (
          <div className="text-center text-muted-foreground py-8">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Erro ao carregar histórico</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleRefresh}
            >
              Tentar novamente
            </Button>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhuma conversão ainda</h3>
            <p className="text-sm mb-4">
              Suas conversões aparecerão aqui após a primeira transação.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  document.querySelector('[data-exchange-widget]')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
              >
                Fazer primeira conversão
              </Button>
              <ExchangeExportButtons className="flex sm:hidden" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* History List */}
            <div className="space-y-3">
              {history.map((order, index) => (
                <div key={order.id}>
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      {getSideIcon(order.side)}
                      <div className="space-y-1">
                        <div className="font-medium">
                          {order.operation_type}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-medium tabular-nums">
                        {order.side === 'buy_rioz' ? (
                          <span className="text-emerald-400">
                            +{ExchangeService.formatCurrency(order.amount_rioz, 'RIOZ')}
                          </span>
                        ) : (
                          <span className="text-rose-400">
                            -{ExchangeService.formatCurrency(order.amount_rioz, 'RIOZ')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm tabular-nums text-muted-foreground">
                        {order.side === 'buy_rioz' 
                          ? `-${ExchangeService.formatCurrency(order.amount_brl, 'BRL')}`
                          : `+${ExchangeService.formatCurrency(order.amount_brl, 'BRL')}`
                        }
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(order.status)}
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {ExchangeService.formatPrice(order.price_brl_per_rioz)}
                      </div>
                    </div>
                  </div>
                  {index < history.length - 1 && <Separator />}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {historyPagination && historyPagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                <div className="text-sm text-muted-foreground">
                  Página {historyPagination.page} de {historyPagination.totalPages}
                  {' '}({historyPagination.total} conversões)
                </div>
                <div className="flex items-center gap-2">
                  <ExchangeExportButtons className="flex sm:hidden" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(historyPagination.page - 1)}
                    disabled={!historyPagination.hasPrev || historyLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(historyPagination.page + 1)}
                    disabled={!historyPagination.hasNext || historyLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};