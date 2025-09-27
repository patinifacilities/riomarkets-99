import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, CheckCircle2, XCircle, Banknote } from 'lucide-react';
import { Order, Market } from '@/types';
import CashoutModal from './CashoutModal';

interface OrderItemProps {
  order: Order;
  market?: Market;
}

const OrderItem = ({ order, market }: OrderItemProps) => {
  const [showCashoutModal, setShowCashoutModal] = useState(false);

  const getStatusInfo = () => {
    switch (order.status) {
      case 'ativa':
        return {
          badge: { variant: 'default' as const, text: 'Análise Ativa', icon: TrendingUp },
          showCashout: true
        };
      case 'cashout':
        return {
          badge: { variant: 'secondary' as const, text: 'Cashout Realizado', icon: Banknote },
          showCashout: false,
          amount: order.cashout_amount
        };
      case 'ganha':
        return {
          badge: { variant: 'default' as const, text: 'Liquidada - Ganhou', icon: CheckCircle2 },
          showCashout: false
        };
      case 'perdida':
        return {
          badge: { variant: 'destructive' as const, text: 'Liquidada - Perdeu', icon: XCircle },
          showCashout: false
        };
      default:
        return {
          badge: { variant: 'outline' as const, text: 'Liquidada', icon: CheckCircle2 },
          showCashout: false
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.badge.icon;

  return (
    <>
      <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/20 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">{market?.titulo || 'Mercado não encontrado'}</h4>
          <Badge variant={statusInfo.badge.variant} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {statusInfo.badge.text}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Opção:</span>
            <span className="font-medium text-foreground uppercase">{order.opcao_escolhida}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Valor analisado:</span>
            <span className="font-semibold">{order.quantidade_moeda.toLocaleString()} Rioz Coin</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Recompensa:</span>
            <span className="font-medium">{order.preco.toFixed(2)}x</span>
          </div>

          {order.status === 'ativa' && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ganho potencial:</span>
              <span className="text-success font-medium">
                {(order.quantidade_moeda * order.preco).toLocaleString()} Rioz Coin
              </span>
            </div>
          )}

          {order.status === 'cashout' && statusInfo.amount && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor recebido:</span>
              <span className="text-success font-bold">
                {statusInfo.amount.toLocaleString()} Rioz Coin
              </span>
            </div>
          )}
        </div>

        {statusInfo.showCashout && (
          <div className="mt-4 pt-3 border-t border-border">
            <Button 
              onClick={() => setShowCashoutModal(true)}
              className="w-full bg-success hover:bg-success/90 text-success-foreground min-h-[44px]"
              size="sm"
              aria-label="Realizar cashout da análise"
            >
              <Banknote className="w-4 h-4 mr-2" />
              Sacar Agora
            </Button>
          </div>
        )}
      </div>

      <CashoutModal
        isOpen={showCashoutModal}
        onClose={() => setShowCashoutModal(false)}
        order={order}
        market={market}
      />
    </>
  );
};

export default OrderItem;