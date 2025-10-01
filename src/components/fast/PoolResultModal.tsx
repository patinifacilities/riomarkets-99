import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PoolResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: {
    id: string;
    result: 'subiu' | 'desceu' | 'manteve';
    opening_price: number;
    closing_price: number;
    price_change_percent: number;
    created_at: string;
    asset_symbol: string;
    pool_id?: string;
  } | null;
  pool?: {
    round_start_time: string;
    round_end_time: string;
    asset_name: string;
  } | null;
}

export const PoolResultModal = ({ open, onOpenChange, result, pool }: PoolResultModalProps) => {
  if (!result) return null;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  const resultColor = result.result === 'subiu' 
    ? 'text-[#00ff90]' 
    : result.result === 'desceu'
    ? 'text-[#ff2389]'
    : 'text-muted-foreground';

  const bgColor = result.result === 'subiu' 
    ? 'bg-[#00ff90]/10 border-[#00ff90]/30' 
    : result.result === 'desceu'
    ? 'bg-[#ff2389]/10 border-[#ff2389]/30'
    : 'bg-muted/20 border-border';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {result.result === 'subiu' ? (
              <TrendingUp className="w-5 h-5 text-[#00ff90]" />
            ) : result.result === 'desceu' ? (
              <TrendingDown className="w-5 h-5 text-[#ff2389]" />
            ) : (
              <span className="text-lg">➡️</span>
            )}
            Detalhes do Resultado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Asset Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-1">
              {pool?.asset_name || result.asset_symbol}
            </h3>
            <Badge variant="outline" className={bgColor}>
              {result.result === 'subiu' ? 'SUBIU' : result.result === 'desceu' ? 'DESCEU' : 'MANTEVE'}
            </Badge>
          </div>

          {/* Price Change */}
          <div className={`p-4 rounded-lg ${bgColor} text-center`}>
            <p className="text-sm text-muted-foreground mb-1">Variação</p>
            <p className={`text-2xl font-bold ${resultColor}`}>
              {result.price_change_percent > 0 ? '+' : ''}{result.price_change_percent.toFixed(2)}%
            </p>
          </div>

          {/* Opening Price */}
          <div className="p-4 rounded-lg bg-card border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Preço de Abertura</p>
                <p className="text-xl font-bold">${result.opening_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <Clock className="w-4 h-4 text-muted-foreground mt-1" />
            </div>
            {pool?.round_start_time && (
              <p className="text-xs text-muted-foreground mt-2">
                {formatTime(pool.round_start_time)}
              </p>
            )}
          </div>

          {/* Closing Price */}
          <div className="p-4 rounded-lg bg-card border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Preço de Fechamento</p>
                <p className="text-xl font-bold">${result.closing_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <Clock className="w-4 h-4 text-muted-foreground mt-1" />
            </div>
            {pool?.round_end_time && (
              <p className="text-xs text-muted-foreground mt-2">
                {formatTime(pool.round_end_time)}
              </p>
            )}
          </div>

          {/* Result Time */}
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Resultado processado em
            </p>
            <p className="text-sm font-medium mt-1">
              {formatTime(result.created_at)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
