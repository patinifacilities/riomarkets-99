import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { ExchangeService } from '@/services/exchange';

interface ConfirmExchangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: 'buy_rioz' | 'sell_rioz';
  inputAmount: string;
  inputCurrency: 'BRL' | 'RIOZ';
  rate: any;
  onConfirm: () => void;
  isLoading: boolean;
}

export const ConfirmExchangeModal = ({
  open,
  onOpenChange,
  side,
  inputAmount,
  inputCurrency,
  rate,
  onConfirm,
  isLoading
}: ConfirmExchangeModalProps) => {
  const numAmount = parseFloat(inputAmount);
  const preview = rate ? ExchangeService.calculatePreview(side, numAmount, inputCurrency, rate.price) : null;

  if (!preview) return null;

  const isLargeTransaction = preview.netAmount >= 1000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLargeTransaction && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
            Confirmar {side === 'buy_rioz' ? 'Compra' : 'Venda'}
          </DialogTitle>
          <DialogDescription>
            {isLargeTransaction && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Transação de alto valor (≥ R$ 1.000)
                  </span>
                </div>
              </div>
            )}
            Verifique os detalhes da sua transação antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo da transação */}
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Você {side === 'buy_rioz' ? 'paga' : 'vende'}:</span>
              <div className="text-right">
                <div className="font-medium">
                  {inputCurrency === 'BRL' 
                    ? `R$ ${numAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : `${numAmount.toLocaleString('pt-BR')} RIOZ`
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center py-2">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Você {side === 'buy_rioz' ? 'recebe' : 'recebe'}:</span>
              <div className="text-right">
                <div className="font-medium text-primary">
                  {side === 'buy_rioz' 
                    ? `${preview.outputAmount.toLocaleString('pt-BR')} RIOZ`
                    : `R$ ${preview.outputAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes da taxa */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de câmbio:</span>
              <Badge variant="secondary">
                1 RIOZ = R$ {rate.price.toFixed(4)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de serviço:</span>
              <span>
                R$ {preview.fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (2%)
              </span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Total:</span>
              <span>
                R$ {preview.netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-gradient-primary shadow-success"
          >
            {isLoading ? 'Processando...' : 'Confirmar Transação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};