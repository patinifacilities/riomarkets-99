import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WalletTransaction } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface TransactionsListProps {
  transactions: WalletTransaction[];
  className?: string;
}

const TransactionsList = ({ transactions, className }: TransactionsListProps) => {
  const getStatusBadge = (transaction: WalletTransaction) => {
    return (
      <Badge variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/40 text-xs">
        Concluído
      </Badge>
    );
  };

  const getTypeBadge = (tipo: string) => {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs border-primary/40 text-primary",
          tipo === 'credito' ? "text-success border-success/40" : "text-danger border-danger/40"
        )}
      >
        {tipo === 'credito' ? 'Entrada' : 'Saída'}
      </Badge>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-muted-foreground mb-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4 opacity-50">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhuma transação no período selecionado
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Não há transações para exibir com os filtros selecionados.
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/'}
          className="border-primary/40 text-primary hover:bg-primary/10"
        >
          Explorar mercados
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="p-4 rounded-lg bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-150 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background"
        >
          {/* Line 1: Market Title */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-foreground truncate flex-1 mr-2">
              {transaction.descricao}
            </h3>
            {transaction.market_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  track('row_open_market', { market_id: transaction.market_id });
                  window.location.href = `/market/${transaction.market_id}`;
                }}
                className="h-auto p-1 hover:bg-primary/10 flex-shrink-0 min-h-[44px] w-[44px]"
                aria-label="Ver mercado relacionado"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Line 2: Date • Type • Status */}
          <div className="flex items-center gap-2 mb-3 text-sm">
            <span className="text-muted-foreground tabular-nums">
              {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </span>
            <span className="w-1 h-1 bg-muted-foreground rounded-full" />
            {getTypeBadge(transaction.tipo)}
            <span className="w-1 h-1 bg-muted-foreground rounded-full" />
            {getStatusBadge(transaction)}
          </div>

          {/* Line 3: Value */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Valor</span>
            <span className={cn(
              "font-semibold tabular-nums text-lg",
              transaction.tipo === 'credito' ? "text-success" : "text-danger"
            )}>
              {transaction.tipo === 'credito' ? '+' : '-'}{transaction.valor.toLocaleString('pt-BR')} Rioz Coin
            </span>
          </div>

          {/* Additional info if market_id exists */}
          {transaction.market_id && (
            <div className="mt-2 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                ID do Mercado: {transaction.market_id}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TransactionsList;