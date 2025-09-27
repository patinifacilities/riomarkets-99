import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { WalletTransaction } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransactionItemProps {
  transaction: WalletTransaction;
}

const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const isCredit = transaction.tipo === 'credito';
  
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/30 hover:shadow-success/10 transition-all duration-150">
      <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full ${
        isCredit 
          ? 'bg-success-muted text-success' 
          : 'bg-danger-muted text-danger'
      }`}>
          {isCredit ? (
            <ArrowUpCircle className="w-4 h-4" />
          ) : (
            <ArrowDownCircle className="w-4 h-4" />
          )}
        </div>
        <div>
          <p className="font-medium">{transaction.descricao}</p>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(transaction.created_at), { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </p>
        </div>
      </div>
      
      <div className={`font-semibold ${
        isCredit ? 'text-success' : 'text-danger'
      }`}>
        {isCredit ? '+' : '-'}{transaction.valor.toLocaleString()} Rioz Coin
      </div>
    </div>
  );
};

export default TransactionItem;