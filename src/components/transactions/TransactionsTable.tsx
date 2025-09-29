import { useState } from 'react';
import { ChevronUp, ChevronDown, ExternalLink, ArrowUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WalletTransaction } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface TransactionsTableProps {
  transactions: WalletTransaction[];
  className?: string;
}

type SortField = 'created_at' | 'valor' | 'tipo';
type SortDirection = 'asc' | 'desc';

const TransactionsTable = ({ transactions, className }: TransactionsTableProps) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    track('sort_transactions_table', { field, direction: sortDirection });
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'valor':
        aValue = a.valor;
        bValue = b.valor;
        break;
      case 'tipo':
        aValue = a.tipo;
        bValue = b.tipo;
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const getStatusBadge = (transaction: WalletTransaction) => {
    // For now, all transactions are completed since that's what exists in the DB
    return (
      <Badge variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/40">
        Concluído
      </Badge>
    );
  };

  const getTypeBadge = (tipo: string) => {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-primary/40 text-primary",
          tipo === 'credito' ? "text-success border-success/40" : "text-danger border-danger/40"
        )}
      >
        {tipo === 'credito' ? 'Entrada' : 'Saída'}
      </Badge>
    );
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 hover:bg-transparent font-semibold"
      aria-sort={sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="w-4 h-4 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-1" />
        )
      ) : (
        <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
      )}
    </Button>
  );

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 border border-border rounded-lg bg-card">
        <div className="text-white mb-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4 opacity-50">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhuma transação encontrada
        </h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          Não há transações para exibir com os filtros selecionados. Tente ajustar os critérios de busca.
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
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <Table id="transactions-table">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">
              <SortButton field="created_at">Data</SortButton>
            </TableHead>
            <TableHead scope="col">Mercado</TableHead>
            <TableHead scope="col">
              <SortButton field="tipo">Tipo</SortButton>
            </TableHead>
            <TableHead scope="col" className="text-right">
              <SortButton field="valor">Valor (Rioz Coin)</SortButton>
            </TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTransactions.map((transaction) => (
            <TableRow key={transaction.id} className="hover:bg-muted/50">
              <TableCell className="font-mono text-sm">
                {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </TableCell>
              <TableCell className="max-w-[200px]">
                <div>
                  <p className="font-medium truncate">{transaction.descricao}</p>
                  {transaction.market_id && (
                    <p className="text-xs text-muted-foreground truncate">
                      ID: {transaction.market_id}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {getTypeBadge(transaction.tipo)}
              </TableCell>
              <TableCell className="text-right">
                <span className={cn(
                  "font-semibold tabular-nums",
                  transaction.tipo === 'credito' ? "text-success" : "text-danger"
                )}>
                  {transaction.tipo === 'credito' ? '+' : '-'}{transaction.valor.toLocaleString('pt-BR')}
                </span>
              </TableCell>
              <TableCell>
                {getStatusBadge(transaction)}
              </TableCell>
              <TableCell>
                {transaction.market_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      track('row_open_market', { market_id: transaction.market_id });
                      window.location.href = `/market/${transaction.market_id}`;
                    }}
                    className="h-auto p-1 hover:bg-primary/10"
                    aria-label="Ver mercado relacionado"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionsTable;