import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCashoutQuote, usePerformCashout } from '@/hooks/useCashout';
import { Order, Market } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface CashoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  market?: Market;
}

const CashoutModal = ({ isOpen, onClose, order, market }: CashoutModalProps) => {
  const [showDriftWarning, setShowDriftWarning] = useState(false);
  const [previousQuote, setPreviousQuote] = useState<number | null>(null);
  
  const { data: quote, isLoading: quoteLoading, error: quoteError, refetch } = useCashoutQuote(
    isOpen ? order.id : undefined
  );
  const performCashout = usePerformCashout();

  // Detect drift on quote changes
  useEffect(() => {
    if (quote && previousQuote !== null) {
      const drift = Math.abs((quote.net - previousQuote) / previousQuote) * 100;
      if (drift > 2) {
        setShowDriftWarning(true);
      }
    }
    if (quote) {
      setPreviousQuote(quote.net);
    }
  }, [quote, previousQuote]);

  const handleConfirmCashout = async () => {
    if (!quote) return;
    
    // Re-fetch quote to prevent drift
    const { data: freshQuote } = await refetch();
    if (freshQuote && quote.net > 0) {
      const drift = Math.abs((freshQuote.net - quote.net) / quote.net) * 100;
      if (drift > 2 && !showDriftWarning) {
        setShowDriftWarning(true);
        return;
      }
    }

    performCashout.mutate(order.id, {
      onSuccess: () => {
        onClose();
        setShowDriftWarning(false);
        setPreviousQuote(null);
      }
    });
  };

  const handleClose = () => {
    onClose();
    setShowDriftWarning(false);
    setPreviousQuote(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Sacar Análise
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Market Summary */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">{market?.titulo || 'Mercado'}</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Opção escolhida:</span>
                <Badge variant="outline" className="uppercase">
                  {order.opcao_escolhida}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Valor original:</span>
                <span className="font-medium">{order.quantidade_moeda.toLocaleString()} Rioz Coin</span>
              </div>
              {order.entry_multiple && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Recompensa de entrada:</span>
                  <span className="font-medium">{order.entry_multiple.toFixed(2)}x</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quote Display */}
          {quoteLoading ? (
            <Card>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </CardContent>
            </Card>
          ) : quoteError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Erro ao calcular cotação. Tente novamente.
              </AlertDescription>
            </Alert>
          ) : quote ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recompensa atual:</span>
                  <span className="text-lg font-bold text-primary">
                    {quote.multiple_now.toFixed(2)}x
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor bruto:</span>
                  <span className="font-medium">
                    {Math.round(quote.gross).toLocaleString()} Rioz Coin
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa da casa ({(quote.cashout_fee_percent * 100).toFixed(1)}%):</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    -{Math.round(quote.fee).toLocaleString()} Rioz Coin
                  </span>
                </div>
                
                <hr className="border-border" />
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Valor líquido:</span>
                  <span className="text-xl font-bold text-success">
                    {Math.round(quote.net).toLocaleString()} Rioz Coin
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Drift Warning */}
          {showDriftWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                A cotação mudou significativamente (+2%). Deseja continuar com o cashout?
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={performCashout.isPending}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmCashout}
            disabled={!quote || quote.net <= 0 || performCashout.isPending || !!quoteError}
            className="bg-success hover:bg-success/90"
          >
            {performCashout.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              `Confirmar Cashout (${quote ? Math.round(quote.net).toLocaleString() : 0} Rioz Coin)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CashoutModal;