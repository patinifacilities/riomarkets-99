import { useState } from 'react';
import { WalletTransaction } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TransactionsListProps {
  transactions: WalletTransaction[];
  className?: string;
}

const TransactionsList = ({ transactions, className }: TransactionsListProps) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  // Calculate stats for expanded view
  const totalReceived = transactions.filter(t => t.tipo === 'credito').reduce((sum, t) => sum + t.valor, 0);
  const totalOpinado = transactions.filter(t => t.tipo === 'debito').reduce((sum, t) => sum + t.valor, 0);

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

  return (
    <div className={cn("space-y-4", className)}>
      {/* Stats Card - Expandable */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Resumo das Transações</p>
                <p className="text-sm text-muted-foreground">
                  {transactions.length} transação{transactions.length !== 1 ? 'ões' : ''}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => toggleExpanded('stats')}
              className="text-muted-foreground hover:text-foreground"
            >
              {expandedItems.has('stats') ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {expandedItems.has('stats') && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-success/10">
                  <p className="text-sm text-muted-foreground">Total Recebido</p>
                  <p className="text-lg font-bold text-success">
                    +{totalReceived.toLocaleString('pt-BR')} RZ
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-danger/10">
                  <p className="text-sm text-muted-foreground">Total Opinado</p>
                  <p className="text-lg font-bold text-danger">
                    -{totalOpinado.toLocaleString('pt-BR')} RZ
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma transação encontrada</h3>
          <p className="text-muted-foreground mb-6">
            Suas transações aparecerão aqui quando você começar a participar dos mercados.
          </p>
          <Link to="/">
            <Button className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Explorar Mercados
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-150"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-full ${
                  transaction.tipo === 'credito' 
                    ? 'bg-success/20 text-success' 
                    : 'bg-danger/20 text-danger'
                }`}>
                  {transaction.tipo === 'credito' ? (
                    <ArrowUpCircle className="w-4 h-4" />
                  ) : (
                    <ArrowDownCircle className="w-4 h-4" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground truncate">
                      {transaction.descricao}
                    </p>
                    {getStatusBadge(transaction)}
                    {getTypeBadge(transaction.tipo)}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(transaction.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                    
                    {transaction.market_id && (
                      <Link 
                        to={`/market/${transaction.market_id}`}
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span>Ver mercado</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`font-semibold ${
                  transaction.tipo === 'credito' ? 'text-success' : 'text-danger'
                }`}>
                  {transaction.tipo === 'credito' ? '+' : '-'}{transaction.valor.toLocaleString('pt-BR')} RIOZ
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsList;